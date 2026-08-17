import path from 'node:path';

import { defineConfig } from 'vite';

import info from './vite/plugins/info';
import infoJson from './vite/plugins/info-json';

/**
 * Server build via the Vite Environment API (https://vite.dev/guide/api-environment-runtimes.html).
 *
 * Mirrors the frontend approach from vite.config.mts: `meteor/*` imports are
 * aliased to a workspace port of the runtime — here `@rocket.chat/meteor-server`
 * instead of `@rocket.chat/meteor-client`.
 *
 * Build with:
 *   yarn vite build --app --config ./vite.config.server.mts
 */

const meteorServer = (specifier: string) => path.resolve(`../../packages/meteor-server/src/${specifier}`);

export default defineConfig({
	appType: 'custom',

	// `rocketchat.info` is a virtual module; other `.info` files are JSON on disk.
	// Meteor's build handled both natively.
	plugins: [info(), infoJson()],

	// Aliases must live at the root (shared) level: a server environment
	// externalizes bare specifiers before per-environment resolve options apply,
	// which would leave `meteor/*` as unresolved external imports.
	// Order matters: the colon-named packages must match before the `meteor` prefix.
	resolve: {
		alias: [
			{ find: 'meteor/ostrio:cookies', replacement: meteorServer('ostrio-cookies.ts') },
			{ find: 'meteor/meteorhacks:inject-initial', replacement: meteorServer('inject-initial.ts') },
			// meteor/* resolves to the workspace port of the server runtime
			{ find: 'meteor', replacement: path.resolve('../../packages/meteor-server/src') },
			{ find: '@rocket.chat/meteor-server', replacement: path.resolve('../../packages/meteor-server/src') },
			// the server runtime reuses environment-agnostic modules from the client port
			{ find: '@rocket.chat/meteor-client', replacement: path.resolve('../../packages/meteor-client/src') },
		],
	},

	environments: {
		server: {
			consumer: 'server',

			resolve: {
				// Dependencies are externalized by default, but an ESM entry cannot
				// take named imports from a CommonJS package whose exports Node fails
				// to detect (e.g. `import { App } from '@slack/bolt'`). Bundling just
				// those lets rolldown generate the interop.
				//
				// Bundling *everything* is not an option: some transitive deps use
				// syntax rolldown rejects (octal escapes in `ansi-color`).
				noExternal: ['@slack/bolt', 'lodash'],
			},

			build: {
				outDir: 'dist-server',
				emptyOutDir: true,
				target: 'esnext',
				sourcemap: true,
				minify: false,
				rolldownOptions: {
					input: {
						main: path.resolve('./server/main.vite.ts'),
					},
					output: {
						format: 'esm',
						entryFileNames: '[name].mjs',
						chunkFileNames: 'chunks/[name]-[hash].mjs',
						// Some app code still uses the CommonJS `__dirname`/`__filename`,
						// which do not exist in an ESM output. Note these now resolve
						// relative to the emitted chunk, not the original source file.
						banner: [
							"import { fileURLToPath as __fileURLToPath } from 'node:url';",
							"import { dirname as __pathDirname } from 'node:path';",
							'const __filename = __fileURLToPath(import.meta.url);',
							'const __dirname = __pathDirname(__filename);',
						].join('\n'),
					},
				},
			},
		},
	},

	builder: {
		async buildApp(builder) {
			await builder.build(builder.environments.server);
		},
	},
});
