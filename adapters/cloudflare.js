/**
 * Cloudflare Workers AI Adapter — Edge inference
 */
const https = require('https');

async function chat({ candidate, prompt, systemPrompt, options = {} }) {
  const apiKey    = process.env[candidate.provider.apiKeyEnv];
  const accountId = process.env[candidate.provider.accountIdEnv];
  const modelId   = candidate.modelId;
  const body = JSON.stringify({
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt }
    ],
    max_tokens:  options.maxTokens  || 2048,
    temperature: options.temperature ?? 0.7,
  });

  const data = await request({
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${accountId}/ai/run/${modelId}`,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  }, body);

  // Cloudflare returns OpenAI-compatible format in result
  const choice  = data.result?.choices?.[0]?.message || {};
  const content = choice.content || choice.reasoning_content
                || data.result?.response || data.result?.generated_text || '';
  const usage   = data.result?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  return { content, usage };
}

function request(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ ...opts, method: 'POST' }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { const d = JSON.parse(raw); if (!d.success) { const e = new Error(JSON.stringify(d.errors)); e.status = res.statusCode; reject(e); } else resolve(d); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

module.exports = { chat };
