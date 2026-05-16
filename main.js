/**
 * Antigravity AI — Main Orchestrator
 * Single entry point for all AI tasks
 *
 * Usage:
 *   const ai = require('./main');
 *   const result = await ai.run({ prompt: "...", taskType: "coding" });
 *   const result = await ai.run({ prompt: "...", options: { hasImage: false, urgency: "high" } });
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const { classifyTask, estimateTokens } = require('./router/classifier');
const { executeWithFailover }          = require('./router/failover');
const tracker                          = require('./analytics/token_tracker');

/**
 * Core run function — classify + select + execute with failover
 * @param {object} params
 * @param {string}  params.prompt        - The user prompt
 * @param {string}  [params.taskType]    - Override auto-detection: 'coding'|'rag'|'hr'|etc
 * @param {string}  [params.systemPrompt]- System instruction
 * @param {object}  [params.options]     - { maxTokens, temperature, hasImage, urgency, budget }
 * @returns {Promise<{result, provider, model, taskType, latency, tokens, attempts}>}
 */
async function run(params = {}) {
  const { prompt, systemPrompt = '', options = {} } = params;

  if (!prompt) throw new Error('[Orchestrator] prompt is required');

  // 1. Detect task type
  const tokenCount = estimateTokens(prompt);
  const taskType   = params.taskType || classifyTask(prompt, { ...options, tokenCount });

  console.log(`[Orchestrator] Task: ${taskType} | ~${tokenCount} tokens | prompt: "${prompt.slice(0, 60)}..."`);

  // 2. Execute with failover
  const response = await executeWithFailover({ prompt, taskType, systemPrompt, options });

  return { ...response, taskType };
}

/**
 * Batch run — process multiple prompts efficiently
 * @param {Array<object>} jobs - Array of { prompt, taskType, systemPrompt, options }
 * @param {number} concurrency - Max parallel jobs (default 3)
 */
async function runBatch(jobs = [], concurrency = 3) {
  const results = [];
  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(job => run(job)));
    results.push(...batchResults.map((r, idx) => ({
      job: batch[idx],
      ...( r.status === 'fulfilled' ? { success: true, ...r.value } : { success: false, error: r.reason?.message })
    })));
  }
  return results;
}

/**
 * Get live dashboard of provider usage
 */
function dashboard() {
  return tracker.getDashboard();
}

/**
 * Get recent call log
 */
function callLog(limit = 20) {
  return tracker.getRecentCalls(limit);
}

module.exports = { run, runBatch, dashboard, callLog };

// ── CLI mode ────────────────────────────────────────────────────────────────
if (require.main === module) {
  const args    = process.argv.slice(2);
  const command = args[0] || 'run';

  if (command === 'dashboard') {
    console.log('\n📊 Antigravity AI Dashboard\n');
    console.log(JSON.stringify(dashboard(), null, 2));
    process.exit(0);
  }

  if (command === 'test') {
    console.log('\n🧪 Running multi-model test suite...\n');
    runTest().catch(console.error);
    return;
  }

  // Default: run a prompt from CLI
  const prompt = args.slice(1).join(' ') || 'What is 2+2? Answer in one word.';
  const task   = command === 'run' ? undefined : command;

  run({ prompt, taskType: task })
    .then(r => {
      console.log(`\n✅ Result [${r.provider} / ${r.model}] (${r.latency}ms)\n`);
      console.log(r.result);
      console.log(`\nTokens: ${JSON.stringify(r.tokens)} | Task: ${r.taskType} | Attempts: ${r.attempts}`);
    })
    .catch(e => { console.error('❌', e.message); process.exit(1); });
}

async function runTest() {
  const tests = [
    { prompt: 'Write a Python function to reverse a string', taskType: 'coding' },
    { prompt: 'Summarize the key benefits of remote work in 3 bullet points', taskType: 'content' },
    { prompt: 'Analyze this candidate: 5 years Python, 3 years ML, MBA. Should we hire?', taskType: 'hr' },
    { prompt: 'What is the capital of France?', taskType: 'fast_automation' },
  ];

  for (const test of tests) {
    try {
      process.stdout.write(`Testing [${test.taskType}]... `);
      const r = await run(test);
      console.log(`✅ ${r.provider}/${r.model} (${r.latency}ms)`);
      console.log(`   ${r.result.slice(0, 100)}...\n`);
    } catch (e) {
      console.log(`❌ FAILED: ${e.message}\n`);
    }
  }

  console.log('\n📊 Final Dashboard:');
  console.log(JSON.stringify(dashboard(), null, 2));
}
