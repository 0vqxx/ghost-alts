const fs = require('fs');
const path = require('path');

try {
  // 1. Patch CLI index so zero arguments defaults to "build"
  const cliPath = path.join(__dirname, '..', 'node_modules', '@opennextjs', 'cloudflare', 'dist', 'cli', 'index.js');
  if (fs.existsSync(cliPath)) {
    let content = fs.readFileSync(cliPath, 'utf8');
    if (!content.includes('nodeProcess.argv.push("build")')) {
      content = content.replace(
        'export function runCommand() {',
        'export function runCommand() {\n    if (nodeProcess.argv.slice(2).filter((arg) => arg !== "--").length === 0) { nodeProcess.argv.push("build"); }'
      );
      fs.writeFileSync(cliPath, content);
      console.log('✓ Successfully patched @opennextjs/cloudflare index to default to build command');
    }
  }
} catch (e) {
  console.warn('Could not patch @opennextjs/cloudflare:', e.message);
}
