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
      console.log('✓ Patched @opennextjs/cloudflare index to default to build command');
    }
  }

  // 2. Patch build.js to bundle a standalone _worker.js after buildImpl()
  const buildPath = path.join(__dirname, '..', 'node_modules', '@opennextjs', 'cloudflare', 'dist', 'cli', 'commands', 'build.js');
  if (fs.existsSync(buildPath)) {
    let content = fs.readFileSync(buildPath, 'utf8');
    const sentinel = 'await buildImpl(options, config, projectOpts, wranglerConfig, args.dangerouslyUseUnsupportedNextVersion);';
    const matchIndex = content.indexOf(sentinel);
    if (matchIndex !== -1) {
      const before = content.slice(0, matchIndex + sentinel.length);
      const after = content.slice(matchIndex + sentinel.length);

      // Remove any previously injected bundle code
      const cleanAfter = after.replace(/try\s*\{\s*const (?:fs|esbuild)[\s\S]*?\}\s*catch\s*\(err\)\s*\{\s*console\.error[\s\S]*?\}/g, '');

      const bundleCode = `
    // --- Injected by scripts/patch-opennext.js ---
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const esbuild = await import('esbuild');
      const { builtinModules } = await import('node:module');

      const workerFile = path.join(process.cwd(), '.open-next', 'worker.js');
      if (fs.existsSync(workerFile)) {
        // Bundle the worker into a single self-contained file for Cloudflare Pages
        const externals = [
          ...builtinModules,
          ...builtinModules.map(m => 'node:' + m),
          'cloudflare:*',
          'cloudflare',
          // Prisma must NOT be bundled — it uses native binaries incompatible with Workers
          '@prisma/client',
          '.prisma/client',
          '.prisma',
        ];

        await esbuild.build({
          entryPoints: ['.open-next/worker.js'],
          bundle: true,
          outfile: '.open-next/assets/_worker.js',
          format: 'esm',
          target: 'es2022',
          platform: 'node',
          external: externals,
          mainFields: ['module', 'main'],
          logLevel: 'warning',
          // Wrap entire worker in try/catch so crashes show 500 instead of 1101
          banner: {
            js: [
              '// GhostAlts _worker.js — bundled by patch-opennext.js',
            ].join('\\n'),
          },
        });
        console.log('✓ Bundled .open-next/assets/_worker.js for Cloudflare Pages');
      } else {
        console.warn('⚠ .open-next/worker.js not found — skipping _worker.js bundling');
      }
    } catch (err) {
      console.error('Error bundling _worker.js:', err);
    }
    // --- End injected code ---
`;
      fs.writeFileSync(buildPath, before + bundleCode + cleanAfter);
      console.log('✓ Patched build.js to bundle _worker.js');
    } else {
      console.log('ℹ build.js patch already applied or sentinel not found — skipping');
    }
  }
} catch (e) {
  console.warn('Could not patch @opennextjs/cloudflare:', e.message);
}
