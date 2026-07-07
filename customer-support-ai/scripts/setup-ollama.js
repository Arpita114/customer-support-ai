#!/usr/bin/env node
/**
 * Ollama Setup Helper Script
 * Checks if Ollama is installed and pulls required models
 */

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const REQUIRED_MODELS = ['llama3.2', 'nomic-embed-text'];

function checkOllamaInstalled() {
  try {
    execSync('ollama --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getInstalledModels() {
  try {
    const output = execSync('ollama list', { encoding: 'utf-8' });
    return output.split('\n').slice(1).map(line => line.split('\s+')[0]).filter(Boolean);
  } catch {
    return [];
  }
}

function pullModel(model) {
  console.log(`\n📥 Pulling ${model}... This may take a few minutes.`);
  try {
    execSync(`ollama pull ${model}`, { stdio: 'inherit' });
    console.log(`✅ ${model} installed successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to pull ${model}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🤖 Customer Support AI - Ollama Setup');
  console.log('=====================================\n');

  // Check if Ollama is installed
  if (!checkOllamaInstalled()) {
    console.error('❌ Ollama is not installed!');
    console.log('\n📥 Please install Ollama first:');
    console.log('   macOS/Linux: curl -fsSL https://ollama.com/install.sh | sh');
    console.log('   Windows: Download from https://ollama.com/download');
    console.log('\n🔄 After installation, run this script again.');
    process.exit(1);
  }

  console.log('✅ Ollama is installed');

  // Check installed models
  const installedModels = getInstalledModels();
  console.log('\n📋 Installed models:', installedModels.length > 0 ? installedModels.join(', ') : 'None');

  // Check required models
  const missingModels = REQUIRED_MODELS.filter(m => !installedModels.includes(m));

  if (missingModels.length === 0) {
    console.log('\n✅ All required models are installed!');
    console.log('   You can now start the application with: npm run dev');
    rl.close();
    return;
  }

  console.log(`\n⚠️  Missing models: ${missingModels.join(', ')}`);

  const answer = await new Promise(resolve => {
    rl.question('\n📥 Install missing models now? (y/n): ', resolve);
  });

  if (answer.toLowerCase() !== 'y') {
    console.log('\n⚠️  Models not installed. The application may not work correctly.');
    rl.close();
    return;
  }

  // Pull missing models
  let allSuccess = true;
  for (const model of missingModels) {
    const success = pullModel(model);
    if (!success) allSuccess = false;
  }

  if (allSuccess) {
    console.log('\n🎉 Setup complete! Start the app with: npm run dev');
  } else {
    console.log('\n⚠️  Some models failed to install. Please try again.');
  }

  rl.close();
}

main().catch(console.error);
