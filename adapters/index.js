/**
 * Antigravity AI — Unified Adapter Index
 * Exports all provider adapters
 */

module.exports = {
  groq:       require('./groq'),
  gemini:     require('./gemini'),
  openrouter: require('./openrouter'),
  github:     require('./github'),
  cloudflare: require('./cloudflare'),
  cerebras:   require('./cerebras'),
  cohere:     require('./cohere'),
  mistral:    require('./mistral'),
  sambanova:  require('./sambanova'),
  nvidia:     require('./nvidia'),
};
