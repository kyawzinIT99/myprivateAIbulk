/**
 * Antigravity AI — n8n HTTP Integration Server
 * Exposes the orchestrator as REST endpoints for n8n HTTP Request nodes
 *
 * Endpoints:
 *   POST /ai          — run a prompt
 *   POST /ai/batch    — run multiple prompts
 *   GET  /ai/status   — provider dashboard
 *   GET  /ai/log      — recent call log
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const http = require('http');
const ai   = require('../../main');

const PORT = process.env.AI_SERVER_PORT || 3999;

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  try {
    // ── POST /ai ──────────────────────────────────────────────────────────
    if (req.method === 'POST' && url === '/ai') {
      const body = await readBody(req);
      if (!body.prompt) return json(res, { error: 'prompt is required' }, 400);

      const result = await ai.run({
        prompt:       body.prompt,
        taskType:     body.taskType,
        systemPrompt: body.systemPrompt,
        options:      body.options || {}
      });
      return json(res, { ok: true, ...result });
    }

    // ── POST /ai/batch ────────────────────────────────────────────────────
    if (req.method === 'POST' && url === '/ai/batch') {
      const body = await readBody(req);
      if (!Array.isArray(body.jobs)) return json(res, { error: 'jobs array is required' }, 400);

      const results = await ai.runBatch(body.jobs, body.concurrency || 3);
      return json(res, { ok: true, count: results.length, results });
    }

    // ── GET /ai/status ────────────────────────────────────────────────────
    if (req.method === 'GET' && url === '/ai/status') {
      return json(res, { ok: true, dashboard: ai.dashboard() });
    }

    // ── GET /ai/log ───────────────────────────────────────────────────────
    if (req.method === 'GET' && url === '/ai/log') {
      return json(res, { ok: true, calls: ai.callLog(30) });
    }

    json(res, { error: 'Not found', endpoints: ['POST /ai', 'POST /ai/batch', 'GET /ai/status', 'GET /ai/log'] }, 404);

  } catch (err) {
    console.error('[Server Error]', err.message);
    json(res, { ok: false, error: err.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Antigravity AI Server running on http://localhost:${PORT}`);
  console.log(`\n  POST http://localhost:${PORT}/ai          — Run a prompt`);
  console.log(`  POST http://localhost:${PORT}/ai/batch     — Batch prompts`);
  console.log(`  GET  http://localhost:${PORT}/ai/status    — Dashboard`);
  console.log(`  GET  http://localhost:${PORT}/ai/log       — Recent calls\n`);
});

module.exports = server;
