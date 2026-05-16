/**
 * Cohere Adapter — RAG and retrieval tasks
 */
const https = require('https');

async function chat({ candidate, prompt, systemPrompt, options = {} }) {
  const apiKey = process.env[candidate.provider.apiKeyEnv];
  const body = JSON.stringify({
    model: candidate.modelId,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt }
    ],
    max_tokens:  options.maxTokens  || 4096,
    temperature: options.temperature ?? 0.7,
  });

  const data = await request({
    hostname: 'api.cohere.ai',
    path: '/v2/chat',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Client-Name': 'antigravity'
    }
  }, body);

  const content = data.message?.content?.[0]?.text || data.text || '';
  return {
    content,
    usage: {
      prompt_tokens:     data.usage?.billed_units?.input_tokens  || 0,
      completion_tokens: data.usage?.billed_units?.output_tokens || 0,
      total_tokens:      (data.usage?.billed_units?.input_tokens || 0) + (data.usage?.billed_units?.output_tokens || 0)
    }
  };
}

function request(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ ...opts, method: 'POST' }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { const d = JSON.parse(raw); if (d.message && res.statusCode >= 400) { const e = new Error(d.message); e.status = res.statusCode; reject(e); } else resolve(d); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

module.exports = { chat };
