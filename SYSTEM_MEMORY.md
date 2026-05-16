# Antigravity AI Orchestrator — System Memory & Instructions

**Last Updated:** May 2026
**Project Status:** 🟢 Production Ready (Serverless Webhook & Local IDE CLI)

## 🧠 System Overview
The Antigravity AI system is a high-availability, multi-model AI routing framework. It analyzes incoming prompts, determines the best AI model for the job based on speed and reasoning requirements, and automatically executes the request. If the primary model fails (due to rate limits or API downtime), it automatically falls back to secondary models using a robust failover chain.

### Included Provider Adapters (8 Active)
- Groq (Primary for Fast Automation)
- GitHub Models (DeepSeek-R1, o3-mini)
- OpenRouter
- Cloudflare Workers AI
- Cerebras
- Mistral
- NVIDIA
- Gemini

---

## 💻 1. IDE CLI Tool (`ai`)
We built a global CLI tool that allows you to trigger massive AI models directly from your IDE terminal without opening a browser.

**How to use:**
```bash
# Ask a general coding question
ai ask "How do I reverse a string in JS?"

# Analyze a local file for bugs using heavy reasoning models (DeepSeek-R1)
ai review src/main.js

# Refactor code
ai refactor src/utils.js

# Generate boilerplate code
ai generate "A fastify server with a health check route"
```
*Note: The CLI is linked globally via `npm link`. It relies on the local `.env` and `config/providers.json` loaded directly from the Antigravity folder.*

---

## ☁️ 2. Serverless Cloud Webhook (Modal)
The orchestrator is deployed to Modal as a serverless container. It scales to 0 when not in use (costing $0) and boots up instantly to handle thousands of parallel requests.

**Permanent Webhook URL:**
`https://kyawzin-ccna--antigravity-ai-webhook-antigravity-webhook.modal.run/ai`

**How to update the Modal Webhook in the future:**
If you change the codebase or update API keys in `.env`, redeploy the webhook by running:
```bash
cd "/Users/berry/Antigravity/Marketing vs Agency/antigravity-ai"
modal deploy modal_deploy.py
```

---

## 🤖 3. n8n Telegram Bot Integration
The orchestrator is fully integrated with n8n. 

**Workflow:**
1. **Telegram Trigger:** Catches user messages.
2. **HTTP Request:** POSTs to the Modal Webhook.
   - **URL:** `https://kyawzin-ccna--antigravity-ai-webhook-antigravity-webhook.modal.run/ai`
   - **Headers:** `Content-Type: application/json`
   - **Body:** `{"prompt": "{{ $json.message.text }}", "taskType": "support"}`
3. **Telegram Send:** Replies to the user with `{{ $json.result }}`.

*The pre-built n8n JSON flow is saved at:* `/Users/berry/Antigravity/Marketing vs Agency/telegram_ai_bot.json`

---

## ⚙️ How the Orchestrator Works internally
1. **`router/classifier.js`**: Analyzes the prompt and assigns a task category (e.g., `fast_automation`, `coding`, `reasoning`).
2. **`router/selector.js`**: Looks at `config/providers.json` to find the primary model tier for that task.
3. **`router/failover.js`**: Attempts to execute the prompt. If it receives a 429 Rate Limit or 500 error, it dynamically switches to the next available provider in the chain until it succeeds.
4. **`integrations/n8n/server.js`**: Exposes the system via REST API.

---

## 🚀 Next Steps / Future Upgrades
- Add API keys for Cohere and SambaNova to `.env` to complete the 10-provider array.
- Integrate a local Vector Database (like Supabase or Chroma) for long-term memory retrieval in HR/Support tasks.
- Attach the CLI tool to Git hooks to automatically review code before `git commit`.
