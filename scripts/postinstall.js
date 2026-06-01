#!/usr/bin/env node
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packages = ['lib/api-client-react', 'lib/api-zod', 'lib/db'];

console.log('Building workspace packages...');
for (const pkg of packages) {
  try {
    const pkgPath = path.join(__dirname, '..', pkg);
    console.log(`Building ${pkg}...`);
    execSync('npm run build', { cwd: pkgPath, stdio: 'inherit' });
  } catch (e) {
    console.error(`Failed to build ${pkg}:`, e.message);
    process.exit(1);
  }
}
console.log('✓ All workspace packages built successfully');
