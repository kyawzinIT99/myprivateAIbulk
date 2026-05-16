/**
 * Antigravity AI — Failover Engine
 * Automatically retries with next available provider on failure
 */

const selector = require('./selector');
const tracker  = require('../analytics/token_tracker');
const adapters = require('../adapters');

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 500;

/**
 * Execute a prompt with automatic failover
 * @param {object} params - { prompt, taskType, systemPrompt, options }
 * @returns {object} - { result, provider, model, latency, tokens }
 */
async function executeWithFailover(params) {
  const { prompt, taskType, systemPrompt = '', options = {} } = params;
  const candidates = await selector.getAllAvailable(taskType);

  if (candidates.length === 0) {
    throw new Error(`[Failover] Zero providers available for task: ${taskType}`);
  }

  let lastError;
  for (let i = 0; i < Math.min(candidates.length, MAX_RETRIES); i++) {
    const candidate = candidates[i];
    const { providerKey, modelTier, modelId, provider } = candidate;

    try {
      console.log(`[Failover] Attempt ${i + 1}/${Math.min(candidates.length, MAX_RETRIES)}: ${providerKey}.${modelTier} (${modelId})`);
      const start = Date.now();

      const result = await callProvider(candidate, prompt, systemPrompt, options);
      const latency = Date.now() - start;

      // Record success
      await tracker.recordCall({
        providerKey, modelTier, modelId,
        tokens: result.usage || { prompt_tokens: 0, completion_tokens: 0 },
        latency, success: true
      });

      console.log(`[Failover] ✅ Success from ${providerKey}.${modelTier} in ${latency}ms`);
      return {
        result: result.content,
        provider: providerKey,
        model: modelId,
        latency,
        tokens: result.usage,
        attempts: i + 1
      };

    } catch (err) {
      lastError = err;
      console.error(`[Failover] ❌ ${providerKey}.${modelTier} failed: ${err.message}`);

      // Mark as rate limited if 429
      if (err.status === 429 || err.message?.includes('429') || err.message?.includes('rate limit')) {
        await tracker.markRateLimited(providerKey, modelTier);
      }

      await tracker.recordCall({
        providerKey, modelTier, modelId: modelId || '?',
        tokens: {}, latency: 0, success: false, error: err.message
      });

      if (i < Math.min(candidates.length, MAX_RETRIES) - 1) {
        await sleep(RETRY_DELAY_MS * (i + 1));
      }
    }
  }

  throw new Error(`[Failover] All providers failed. Last error: ${lastError?.message}`);
}

/**
 * Call the correct adapter based on provider
 */
async function callProvider(candidate, prompt, systemPrompt, options) {
  const { providerKey } = candidate;
  const adapter = adapters[providerKey];

  if (!adapter) {
    throw new Error(`No adapter found for provider: ${providerKey}`);
  }

  return await adapter.chat({ candidate, prompt, systemPrompt, options });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { executeWithFailover };
