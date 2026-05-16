/**
 * Antigravity AI — Task Classifier
 * Dynamically detects task type from prompt + metadata
 */

const TASK_PATTERNS = {
  coding: {
    keywords: ['code', 'function', 'script', 'debug', 'api', 'json', 'python', 'javascript', 'sql', 'regex', 'error', 'fix bug', 'refactor', 'implement'],
    weight: 3
  },
  reasoning: {
    keywords: ['analyze', 'compare', 'evaluate', 'assess', 'think', 'reason', 'why', 'how does', 'explain', 'strategy', 'decision', 'pros and cons', 'which is better'],
    weight: 2
  },
  long_context: {
    keywords: ['document', 'report', 'summarize', 'research', 'paper', 'article', 'full text', 'entire', 'all of the', 'review this'],
    weight: 2
  },
  rag: {
    keywords: ['search', 'find', 'retrieve', 'lookup', 'database', 'knowledge base', 'vector', 'embedding', 'semantic'],
    weight: 3
  },
  fast_automation: {
    keywords: ['extract', 'parse', 'format', 'convert', 'transform', 'classify', 'categorize', 'tag', 'label', 'structure', 'json format'],
    weight: 2
  },
  hr: {
    keywords: ['cv', 'resume', 'candidate', 'interview', 'hire', 'skill', 'talent', 'employee', 'salary', 'job description', 'performance'],
    weight: 3
  },
  lead_gen: {
    keywords: ['lead', 'prospect', 'outreach', 'cold email', 'sales', 'company', 'contact', 'linkedin', 'scrape', 'qualify'],
    weight: 3
  },
  support: {
    keywords: ['help', 'issue', 'problem', 'support', 'complaint', 'question', 'how to', 'not working', 'broken', 'fix'],
    weight: 2
  },
  vision: {
    keywords: ['image', 'photo', 'picture', 'screenshot', 'visual', 'look at', 'see this', 'describe this image'],
    weight: 4
  },
  content: {
    keywords: ['write', 'blog', 'article', 'post', 'content', 'copy', 'seo', 'headline', 'caption', 'draft', 'email'],
    weight: 2
  },
  premium_writing: {
    keywords: ['proposal', 'executive', 'strategy report', 'business plan', 'legal', 'contract', 'official', 'board', 'investor'],
    weight: 3
  }
};

/**
 * Classify a task from prompt text and optional metadata
 * @param {string} prompt
 * @param {object} options - { hasImage, tokenCount, urgency, budget }
 * @returns {string} taskType
 */
function classifyTask(prompt, options = {}) {
  const text = prompt.toLowerCase();
  const scores = {};

  // Score each task type
  for (const [taskType, config] of Object.entries(TASK_PATTERNS)) {
    scores[taskType] = 0;
    for (const kw of config.keywords) {
      if (text.includes(kw)) {
        scores[taskType] += config.weight;
      }
    }
  }

  // Override rules
  if (options.hasImage) return 'vision';
  if (options.tokenCount > 50000) return 'long_context';
  if (options.urgency === 'high') {
    // Boost speed-friendly tasks
    scores['fast_automation'] += 5;
    scores['support'] += 3;
  }
  if (options.budget === 'zero') {
    // Penalize premium_writing slightly
    scores['premium_writing'] -= 2;
  }

  // Pick highest score, fallback to content
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0];

  if (best[1] === 0) return 'fast_automation'; // default
  return best[0];
}

/**
 * Estimate token count from text
 */
function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

module.exports = { classifyTask, estimateTokens };
