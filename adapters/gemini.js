/**
 * Google Gemini Adapter — Long context + reasoning
 * Uses Gemini 2.5 Flash, Gemini 2.5 Flash-Lite, Gemma 3 27B
 */

const https = require('https');

async function chat({ candidate, prompt, systemPrompt, options = {} }) {
  const apiKey = process.env[candidate.provider.apiKeyEnv];
  const modelId = candidate.modelId;
  const isGemma = modelId.startsWith('gemma');

  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    ...(systemPrompt && !isGemma ? {
      systemInstruction: { parts: [{ text: systemPrompt }] }
    } : {}),
    generationConfig: {
      maxOutputTokens: options.maxTokens  || 8192,
      temperature:     options.temperature ?? 0.7,
    }
  });

  const data = await request({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
    headers: { 'Content-Type': 'application/json' }
  }, body);

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usage = {
    prompt_tokens:     data.usageMetadata?.promptTokenCount || 0,
    completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
    total_tokens:      data.usageMetadata?.totalTokenCount || 0
  };

  return { content, usage };
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
