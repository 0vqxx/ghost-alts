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

  // 2. Patch build.js to bundle a standalone _worker.js for Cloudflare Pages
  const buildPath = path.join(__dirname, '..', 'node_modules', '@opennextjs', 'cloudflare', 'dist', 'cli', 'commands', 'build.js');
  if (fs.existsSync(buildPath)) {
    let content = fs.readFileSync(buildPath, 'utf8');
    // Replace any old patch
    const matchIndex = content.indexOf('await buildImpl(options, config, projectOpts, wranglerConfig, args.dangerouslyUseUnsupportedNextVersion);');
    if (matchIndex !== -1) {
      const before = content.slice(0, matchIndex + 'await buildImpl(options, config, projectOpts, wranglerConfig, args.dangerouslyUseUnsupportedNextVersion);'.length);
      const after = content.slice(matchIndex + 'await buildImpl(options, config, projectOpts, wranglerConfig, args.dangerouslyUseUnsupportedNextVersion);'.length);
      
      const cleanAfter = after.replace(/try\s*\{\s*const fs = await import\('node:fs'\);[\s\S]*?\}\s*catch\s*\(e\)\s*\{\s*console\.error[\s\S]*?\}/, '');

      const bundleCode = `
    try {
      const esbuild = await import('esbuild');
      const { builtinModules } = await import('node:module');
      const externals = [
        ...builtinModules,
        ...builtinModules.map(m => 'node:' + m),
        'cloudflare:*',
        'cloudflare'
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
        logLevel: 'warning'
      });
      console.log('✓ Successfully bundled standalone .open-next/assets/_worker.js for Cloudflare Pages');
    } catch (err) {
      console.error('Error bundling _worker.js:', err);
    }
`;
      fs.writeFileSync(buildPath, before + bundleCode + cleanAfter);
      console.log('✓ Successfully patched build.js to bundle standalone _worker.js');
    }
  }
} catch (e) {
  console.warn('Could not patch @opennextjs/cloudflare:', e.message);
}
