/**
 * OpenRouter Adapter — Multi-model gateway with free tier
 * Free models: Llama 3.3 70B, GPT-OSS 120B, Qwen3-Coder, Gemma 4 31B
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
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer':  'https://antigravity.ai',
      'X-Title':       'Antigravity Multi-Model'
    }
  }, body);

  return {
    content: data.choices[0].message.content,
    usage: data.usage
  };
}

function request(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ ...opts, method: 'POST' }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try {
          const d = JSON.parse(raw);
          if (d.error) { const e = new Error(d.error.message); e.status = res.statusCode; reject(e); }
          else resolve(d);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

module.exports = { chat };
