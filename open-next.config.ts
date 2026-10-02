import type { OpenNextConfig } from '@opennextjs/cloudflare';
import assetResolver from '@opennextjs/cloudflare/overrides/asset-resolver/index';

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare-node',
      converter: 'edge',
      proxyExternalRequest: 'fetch',
      incrementalCache: 'dummy',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },
  // Next.js uses node:crypto at runtime; keep it native to workerd.
  edgeExternals: ['node:crypto'],
  middleware: {
    external: true,
    // The external middleware handles requests before the Next server. Give
    // its routing layer the Pages asset resolver so CSS, JS, and public files
    // are served from the ASSETS binding instead of becoming app-route 404s.
    assetResolver: () => assetResolver,
    override: {
      wrapper: 'cloudflare-edge',
      converter: 'edge',
      proxyExternalRequest: 'fetch',
      incrementalCache: 'dummy',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },
};

export default config;
