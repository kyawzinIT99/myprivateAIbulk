/**
 * HR Automation Workflow
 * CV Intake → Groq | Skill Matching → Gemini | Interview Scoring → GitHub
 */

const ai = require('../main');

const SYSTEM_HR = `You are an expert HR analyst. Be concise, structured, and objective. 
Output in clean JSON when asked. Evaluate candidates fairly without bias.`;

/**
 * Parse a CV/resume — fast extraction
 */
async function parseCV(cvText) {
  return ai.run({
    prompt: `Extract structured data from this CV. Return JSON with: name, email, phone, skills[], experience_years, last_role, education, languages[]\n\nCV:\n${cvText}`,
    taskType: 'fast_automation',
    systemPrompt: SYSTEM_HR,
    options: { maxTokens: 1024 }
  });
}

/**
 * Match candidate against job requirements
 */
async function matchCandidate(candidateData, jobDescription) {
  return ai.run({
    prompt: `Score this candidate (0-100) for the job. Return JSON: { score, strengths[], gaps[], recommendation }\n\nCandidate: ${JSON.stringify(candidateData)}\n\nJob: ${jobDescription}`,
    taskType: 'hr',
    systemPrompt: SYSTEM_HR,
    options: { maxTokens: 512 }
  });
}

/**
 * Generate interview questions
 */
async function generateInterviewQuestions(candidateData, jobDescription, count = 5) {
  return ai.run({
    prompt: `Generate ${count} targeted interview questions for this candidate applying for: ${jobDescription}\n\nCandidate background: ${JSON.stringify(candidateData)}\n\nFocus on their gaps and key skills needed.`,
    taskType: 'hr',
    systemPrompt: SYSTEM_HR,
    options: { maxTokens: 1024 }
  });
}

/**
 * Score interview responses
 */
async function scoreInterview(questions, answers) {
  return ai.run({
    prompt: `Score these interview responses (0-10 each). Return JSON: { scores: [{question, score, feedback}], overall_score, hire_recommendation }\n\nQ&A:\n${questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'No answer'}`).join('\n\n')}`,
    taskType: 'reasoning',
    systemPrompt: SYSTEM_HR,
    options: { maxTokens: 1024 }
  });
}

/**
 * Generate HR report
 */
async function generateReport(candidateData, matchScore, interviewScore) {
  return ai.run({
    prompt: `Write a professional HR evaluation report for:\nCandidate: ${JSON.stringify(candidateData)}\nMatch Score: ${JSON.stringify(matchScore)}\nInterview Score: ${JSON.stringify(interviewScore)}\n\nInclude: Executive Summary, Strengths, Concerns, Decision, Next Steps.`,
    taskType: 'premium_writing',
    systemPrompt: SYSTEM_HR,
    options: { maxTokens: 2048 }
  });
}

module.exports = { parseCV, matchCandidate, generateInterviewQuestions, scoreInterview, generateReport };
