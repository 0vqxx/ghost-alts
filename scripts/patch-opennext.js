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

  // 2. Patch build command to copy worker.js to assets/_worker.js for Cloudflare Pages
  const buildPath = path.join(__dirname, '..', 'node_modules', '@opennextjs', 'cloudflare', 'dist', 'cli', 'commands', 'build.js');
  if (fs.existsSync(buildPath)) {
    let content = fs.readFileSync(buildPath, 'utf8');
    if (!content.includes('_worker.js')) {
      content = content.replace(
        'await buildImpl(options, config, projectOpts, wranglerConfig, args.dangerouslyUseUnsupportedNextVersion);',
        `await buildImpl(options, config, projectOpts, wranglerConfig, args.dangerouslyUseUnsupportedNextVersion);
        try {
          const fs = await import('node:fs');
          const path = await import('node:path');
          const workerSrc = path.join(process.cwd(), '.open-next', 'worker.js');
          const workerDest = path.join(process.cwd(), '.open-next', 'assets', '_worker.js');
          if (fs.existsSync(workerSrc)) {
            fs.copyFileSync(workerSrc, workerDest);
            console.log('✓ Copied .open-next/worker.js -> .open-next/assets/_worker.js for Cloudflare Pages');
          }
        } catch (e) {
          console.error('Error copying _worker.js:', e);
        }`
      );
      fs.writeFileSync(buildPath, content);
      console.log('✓ Successfully patched build.js to output _worker.js for Cloudflare Pages');
    }
  }
} catch (e) {
  console.warn('Could not patch @opennextjs/cloudflare:', e.message);
}
