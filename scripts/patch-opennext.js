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

  // 2. Patch build.js to wrap worker with top-level error handling and bundle a standalone _worker.js
  const buildPath = path.join(__dirname, '..', 'node_modules', '@opennextjs', 'cloudflare', 'dist', 'cli', 'commands', 'build.js');
  if (fs.existsSync(buildPath)) {
    let content = fs.readFileSync(buildPath, 'utf8');
    const matchIndex = content.indexOf('await buildImpl(options, config, projectOpts, wranglerConfig, args.dangerouslyUseUnsupportedNextVersion);');
    if (matchIndex !== -1) {
      const before = content.slice(0, matchIndex + 'await buildImpl(options, config, projectOpts, wranglerConfig, args.dangerouslyUseUnsupportedNextVersion);'.length);
      const after = content.slice(matchIndex + 'await buildImpl(options, config, projectOpts, wranglerConfig, args.dangerouslyUseUnsupportedNextVersion);'.length);
      
      const cleanAfter = after.replace(/try\s*\{\s*const (?:fs|esbuild)[\s\S]*?\}\s*catch\s*\(err\)\s*\{\s*console\.error[\s\S]*?\}/g, '');

      const bundleCode = `
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const esbuild = await import('esbuild');
      const { builtinModules } = await import('node:module');

      const workerFile = path.join(process.cwd(), '.open-next', 'worker.js');
      if (fs.existsSync(workerFile)) {
        let workerCode = fs.readFileSync(workerFile, 'utf8');
        if (!workerCode.includes('__CATCH_WORKER_ERROR__')) {
          workerCode = workerCode.replace(
            'async fetch(request, env, ctx) {',
            'async fetch(request, env, ctx) {\\n        try { /* __CATCH_WORKER_ERROR__ */'
          );
          workerCode = workerCode.replace(
            'return handler(reqOrResp, env, ctx, request.signal);\\n        });\\n    },',
            'return await handler(reqOrResp, env, ctx, request.signal);\\n        });\\n        } catch (workerErr) {\\n          return new Response(String(workerErr?.stack || workerErr), { status: 500, headers: { \\'content-type\\': \\'text/plain\\' } });\\n        }\\n    },'
          );
          fs.writeFileSync(workerFile, workerCode);
        }
      }

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
      console.log('✓ Successfully bundled robust .open-next/assets/_worker.js for Cloudflare Pages');
    } catch (err) {
      console.error('Error bundling _worker.js:', err);
    }
`;
      fs.writeFileSync(buildPath, before + bundleCode + cleanAfter);
      console.log('✓ Successfully patched build.js to bundle robust _worker.js');
    }
  }
} catch (e) {
  console.warn('Could not patch @opennextjs/cloudflare:', e.message);
}
