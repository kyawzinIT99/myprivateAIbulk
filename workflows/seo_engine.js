/**
 * SEO Content Engine Workflow
 * Keyword Research → Bulk Writing → Premium Copy → Publishing
 */

const ai = require('../main');

const SYSTEM_SEO = `You are an expert SEO content strategist and copywriter.
Create engaging, search-optimized content. Use proper heading hierarchy. Be informative and authoritative.`;

async function researchKeywords(topic, targetAudience) {
  return ai.run({
    prompt: `Research SEO keywords for: "${topic}"\nTarget audience: ${targetAudience}\n\nReturn JSON: { primary_keyword, secondary_keywords[], long_tail_keywords[], search_intent, difficulty_estimate }`,
    taskType: 'long_context',
    systemPrompt: SYSTEM_SEO,
    options: { maxTokens: 1024 }
  });
}

async function writeBlogPost(keyword, outline, wordCount = 800) {
  return ai.run({
    prompt: `Write a ${wordCount}-word SEO blog post for keyword: "${keyword}"\nOutline: ${JSON.stringify(outline)}\n\nInclude: H1, H2s, meta description (155 chars), natural keyword usage, CTA at end.`,
    taskType: 'content',
    systemPrompt: SYSTEM_SEO,
    options: { maxTokens: 3000, temperature: 0.75 }
  });
}

async function writePremiumSalesCopy(productName, targetAudience, painPoints) {
  return ai.run({
    prompt: `Write high-converting sales copy for: ${productName}\nAudience: ${targetAudience}\nPain points: ${painPoints.join(', ')}\n\nInclude: Headline, subheadline, benefits, social proof placeholder, CTA. Use AIDA framework.`,
    taskType: 'premium_writing',
    systemPrompt: SYSTEM_SEO,
    options: { maxTokens: 2048, temperature: 0.8 }
  });
}

async function generateMetaTags(pageContent, keyword) {
  return ai.run({
    prompt: `Generate SEO meta tags for this page. Return JSON: { title (60 chars max), description (155 chars max), og_title, og_description, schema_type }\n\nKeyword: ${keyword}\nContent: ${pageContent.slice(0, 2000)}`,
    taskType: 'fast_automation',
    systemPrompt: SYSTEM_SEO,
    options: { maxTokens: 512 }
  });
}

async function bulkGenerateContent(topics = [], type = 'blog') {
  const jobs = topics.map(topic => ({
    prompt: `Write a compelling ${type} about: "${topic}". 300-400 words. SEO optimized.`,
    taskType: 'content',
    systemPrompt: SYSTEM_SEO,
    options: { maxTokens: 1024, temperature: 0.8 }
  }));

  const { runBatch } = require('../main');
  return runBatch(jobs, 3);
}

module.exports = { researchKeywords, writeBlogPost, writePremiumSalesCopy, generateMetaTags, bulkGenerateContent };
