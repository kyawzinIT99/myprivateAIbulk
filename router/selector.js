/**
 * Antigravity AI — Dynamic Model Selector
 * Picks the best available provider+model for a task
 */

const config  = require('../config/providers.json');
const tracker = require('../analytics/token_tracker');

/**
 * Get ordered list of [provider, modelTier] candidates for a task
 */
function getCandidates(taskType) {
  const routing = config.taskRouting[taskType] || config.taskRouting['fast_automation'];
  return routing.map(ref => {
    const [providerKey, modelTier] = ref.split('.');
    return { providerKey, modelTier };
  });
}

/**
 * Select best available model, skipping rate-limited ones
 * @param {string} taskType
 * @returns {{ providerKey, modelTier, modelId, providerConfig }}
 */
async function selectModel(taskType) {
  const candidates = getCandidates(taskType);

  for (const { providerKey, modelTier } of candidates) {
    const provider = config.providers[providerKey];
    if (!provider) continue;

    // Check if API key is configured
    const apiKey = process.env[provider.apiKeyEnv];
    if (!apiKey) {
      console.warn(`[Selector] Skipping ${providerKey} — no API key set (${provider.apiKeyEnv})`);
      continue;
    }

    const model = provider.models[modelTier];
    if (!model) continue;

    // Check rate limit status
    const isLimited = await tracker.isRateLimited(providerKey, modelTier);
    if (isLimited) {
      console.warn(`[Selector] ${providerKey}.${modelTier} is rate limited — skipping`);
      continue;
    }

    console.log(`[Selector] ✅ Selected: ${providerKey}.${modelTier} (${model.id})`);
    return {
      providerKey,
      modelTier,
      modelId: model.id,
      provider,
      model
    };
  }

  throw new Error(`[Selector] No available models for task: ${taskType}`);
}

/**
 * Get all available providers for a task (for parallel requests)
 */
async function getAllAvailable(taskType) {
  const candidates = getCandidates(taskType);
  const available = [];

  for (const { providerKey, modelTier } of candidates) {
    const provider = config.providers[providerKey];
    if (!provider) continue;
    const apiKey = process.env[provider.apiKeyEnv];
    if (!apiKey) continue;
    const model = provider.models[modelTier];
    if (!model) continue;
    const isLimited = await tracker.isRateLimited(providerKey, modelTier);
    if (!isLimited) {
      available.push({ providerKey, modelTier, modelId: model.id, provider, model });
    }
  }

  return available;
}

module.exports = { selectModel, getAllAvailable, getCandidates };
