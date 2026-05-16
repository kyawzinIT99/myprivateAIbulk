/**
 * Lead Generation Workflow
 * Scrape → Qualify → Cold Email → CRM Format
 */

const ai = require('../main');

const SYSTEM_SALES = `You are an expert B2B sales strategist. Be concise and persuasive.
Output structured JSON when asked. Focus on value proposition and pain points.`;

async function qualifyLead(leadData) {
  return ai.run({
    prompt: `Score this lead (0-100) for B2B sales potential. Return JSON: { score, tier, pain_points[], budget_signal, decision_maker, next_action }\n\nLead: ${JSON.stringify(leadData)}`,
    taskType: 'lead_gen',
    systemPrompt: SYSTEM_SALES,
    options: { maxTokens: 512 }
  });
}

async function writeColdEmail(leadData, productDescription) {
  return ai.run({
    prompt: `Write a personalized cold email for:\nLead: ${JSON.stringify(leadData)}\nProduct: ${productDescription}\n\nKeep under 150 words. Subject line + body. No fluff.`,
    taskType: 'content',
    systemPrompt: SYSTEM_SALES,
    options: { maxTokens: 512, temperature: 0.8 }
  });
}

async function writePremiumProposal(companyData, productDescription, dealValue) {
  return ai.run({
    prompt: `Write a compelling sales proposal for a $${dealValue} deal.\nClient: ${JSON.stringify(companyData)}\nSolution: ${productDescription}\n\nInclude: Executive Summary, Problem Statement, Solution, ROI, Pricing, Next Steps.`,
    taskType: 'premium_writing',
    systemPrompt: SYSTEM_SALES,
    options: { maxTokens: 3000 }
  });
}

async function extractLeadFromText(rawText) {
  return ai.run({
    prompt: `Extract lead information from this text. Return JSON: { company, name, role, email, phone, website, industry, employee_count }\n\nText: ${rawText}`,
    taskType: 'fast_automation',
    systemPrompt: SYSTEM_SALES,
    options: { maxTokens: 512 }
  });
}

async function generateFollowUpSequence(leadData, stage = 'initial', count = 3) {
  return ai.run({
    prompt: `Generate ${count} follow-up messages (stage: ${stage}) for:\nLead: ${JSON.stringify(leadData)}\nEach message should be different in angle. Return as JSON array: [{day, subject, body}]`,
    taskType: 'content',
    systemPrompt: SYSTEM_SALES,
    options: { maxTokens: 2048, temperature: 0.8 }
  });
}

module.exports = { qualifyLead, writeColdEmail, writePremiumProposal, extractLeadFromText, generateFollowUpSequence };
