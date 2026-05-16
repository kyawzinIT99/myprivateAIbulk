/**
 * Antigravity AI — Token & Rate Limit Tracker
 * In-memory tracking with file persistence
 */

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../analytics/usage_data.json');

let state = loadState();

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (_) {}
  return { calls: [], rateLimits: {}, daily: {}, totals: {} };
}

function saveState() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2)); } catch (_) {}
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Check if a provider+model is currently rate limited
 */
async function isRateLimited(providerKey, modelTier) {
  const key = `${providerKey}.${modelTier}`;
  const rl  = state.rateLimits[key];
  if (!rl) return false;
  if (Date.now() > rl.until) {
    delete state.rateLimits[key];
    saveState();
    return false;
  }
  return true;
}

/**
 * Mark a provider+model as rate limited for cooldown period
 */
async function markRateLimited(providerKey, modelTier, cooldownMs = 60000) {
  const key = `${providerKey}.${modelTier}`;
  state.rateLimits[key] = { until: Date.now() + cooldownMs, since: new Date().toISOString() };
  console.warn(`[Tracker] Rate limited: ${key} for ${cooldownMs / 1000}s`);
  saveState();
}

/**
 * Record a call to any provider
 */
async function recordCall({ providerKey, modelTier, modelId, tokens, latency, success, error }) {
  const today = todayKey();
  const key   = `${providerKey}.${modelTier}`;

  // Daily stats
  if (!state.daily[today]) state.daily[today] = {};
  if (!state.daily[today][key]) {
    state.daily[today][key] = { calls: 0, tokens: 0, errors: 0, totalLatency: 0 };
  }
  state.daily[today][key].calls++;
  state.daily[today][key].tokens      += (tokens?.total_tokens || 0);
  state.daily[today][key].totalLatency += latency;
  if (!success) state.daily[today][key].errors++;

  // Totals
  if (!state.totals[key]) state.totals[key] = { calls: 0, tokens: 0, errors: 0 };
  state.totals[key].calls++;
  state.totals[key].tokens += (tokens?.total_tokens || 0);
  if (!success) state.totals[key].errors++;

  // Rolling log (keep last 200)
  state.calls.push({
    ts: new Date().toISOString(), providerKey, modelTier, modelId,
    tokens: tokens?.total_tokens || 0,
    latency, success, error: error || null
  });
  if (state.calls.length > 200) state.calls = state.calls.slice(-200);

  saveState();
}

/**
 * Get a summary dashboard
 */
function getDashboard() {
  const today = todayKey();
  const todayStats = state.daily[today] || {};
  const summary = { today: {}, totals: state.totals, rateLimits: {} };

  for (const [key, stats] of Object.entries(todayStats)) {
    summary.today[key] = {
      calls:   stats.calls,
      tokens:  stats.tokens,
      errors:  stats.errors,
      avgLatency: stats.calls > 0 ? Math.round(stats.totalLatency / stats.calls) : 0,
      successRate: stats.calls > 0 ? `${Math.round((1 - stats.errors / stats.calls) * 100)}%` : 'N/A'
    };
  }

  for (const [key, rl] of Object.entries(state.rateLimits)) {
    const remaining = Math.max(0, Math.round((rl.until - Date.now()) / 1000));
    summary.rateLimits[key] = `${remaining}s remaining`;
  }

  return summary;
}

/**
 * Get recent call log
 */
function getRecentCalls(limit = 20) {
  return state.calls.slice(-limit).reverse();
}

module.exports = { isRateLimited, markRateLimited, recordCall, getDashboard, getRecentCalls };
