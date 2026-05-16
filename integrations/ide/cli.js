#!/usr/bin/env node

/**
 * Antigravity IDE Tool
 * Command-line assistant that connects your IDE terminal directly 
 * to the Multi-Model Orchestrator (DeepSeek, Llama 3, Gemini, etc).
 */

const fs = require('fs');
const path = require('path');
const ai = require('../../main');

const [,, command, ...args] = process.argv;

const printSuccess = (text) => console.log('\x1b[32m%s\x1b[0m', text);
const printError = (text) => console.log('\x1b[31m%s\x1b[0m', text);
const printInfo = (text) => console.log('\x1b[36m%s\x1b[0m', text);

async function runIDECommand() {
  if (!command) {
    console.log(`
🚀 Antigravity IDE CLI
Usage:
  ai ask "your question"          - Ask a coding question
  ai review <filename>            - Review code for bugs and improvements
  ai refactor <filename>          - Suggest a refactored version
  ai generate "description"       - Generate boilerplate code
    `);
    process.exit(0);
  }

  try {
    let prompt = '';
    let taskType = 'coding';

    if (command === 'ask') {
      prompt = args.join(' ');
      printInfo(`🤔 Asking AI: "${prompt}"...`);
      
    } else if (command === 'review' || command === 'refactor') {
      const file = args[0];
      if (!file || !fs.existsSync(file)) {
        return printError(`File not found: ${file}`);
      }
      const code = fs.readFileSync(file, 'utf8');
      const action = command === 'review' ? 'Review this code for bugs, security issues, and performance optimizations' : 'Refactor this code to be more modern, clean, and efficient';
      
      prompt = `${action}. Output markdown.\n\nFile: ${file}\n\`\`\`\n${code}\n\`\`\``;
      taskType = 'reasoning'; // Use the heavy reasoning models for file analysis
      printInfo(`👀 Analyzing ${file} using High-IQ models...`);

    } else if (command === 'generate') {
      prompt = `Generate code for: ${args.join(' ')}. Output ONLY valid code, no markdown wrapping if possible.`;
      printInfo(`🏗️ Generating code...`);
      
    } else {
      // Direct prompt fallback
      prompt = [command, ...args].join(' ');
      printInfo(`🚀 Processing...`);
    }

    const start = Date.now();
    
    // Send to the Multi-Model Orchestrator
    const response = await ai.run({
      prompt,
      taskType,
      options: { maxTokens: 4096 }
    });

    const ms = Date.now() - start;
    
    console.log('\n──────────────────────────────────────────────────');
    console.log(response.result);
    console.log('──────────────────────────────────────────────────');
    printSuccess(`✅ Answered by ${response.provider} (${response.model}) in ${ms}ms`);

  } catch (error) {
    printError(`❌ Error: ${error.message}`);
  }
}

runIDECommand();
