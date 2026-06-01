#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Remove lock files (cross-platform)
['package-lock.json', 'yarn.lock'].forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  } catch (e) {
    // Ignore errors
  }
});

const userAgent = process.env.npm_config_user_agent || '';
if (!userAgent.includes('pnpm')) {
  // Allow pnpm preinstall to proceed, only strict in CI/CD
  if (process.env.CI) {
    console.error('Use pnpm instead');
    process.exit(1);
  }
}
