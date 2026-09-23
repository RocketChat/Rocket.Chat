import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssEasyImport from 'postcss-easy-import';
import postcssMediaMinmax from 'postcss-media-minmax';
import postcssNested from 'postcss-nested';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const require = createRequire(import.meta.url);
const swiperRoot = dirname(require.resolve('swiper/package.json'));

// Replaces the rocketchat:version Meteor compiler plugin for `app/utils/rocketchat.info`.
const rocketchatInfo = (): Plugin => {
	const virtualId = '\0rocketchat-info';

	const git = (command: string) => {
		try {
			return execSync(`git ${command}`, { cwd: appRoot, encoding: 'utf8' }).trim();
		} catch {
			return undefined;
		}
	};

	return {
		name: 'rocketchat-info',
		enforce: 'pre',
		resolveId: (id) => (id.endsWith('rocketchat.info') ? virtualId : undefined),
		load: (id) => {
			if (id !== virtualId) return undefined;

			const info = {
				...JSON.parse(readFileSync(join(appRoot, 'app/utils/rocketchat.info'), 'utf8')),
				marketplaceApiVersion: require('@rocket.chat/apps-engine/package.json').version.replace(/^[^0-9]/g, ''),
				build: { date: new Date().toISOString() },
				commit: { hash: git('rev-parse HEAD'), branch: git('rev-parse --abbrev-ref HEAD') },
			};

			return `export const Info = ${JSON.stringify(info)};`;
		},
	};
};

export default defineConfig({
	root: here,
	publicDir: join(appRoot, 'public'),
	plugins: [react(), rocketchatInfo()],
	resolve: {
		alias: [
			{ find: /^meteor\/.*$/, replacement: join(here, 'shims/meteor.ts') },
			// Source reaches into swiper's internals through deep paths its `exports` field does not list.
			{ find: /^swiper\/swiper-react\.mjs$/, replacement: join(swiperRoot, 'swiper-react.mjs') },
			{ find: /^swiper\/modules\/index\.mjs$/, replacement: join(swiperRoot, 'modules/index.mjs') },
			{ find: /^swiper\/swiper\.css$/, replacement: join(swiperRoot, 'swiper.css') },
			{ find: /^swiper\/modules\/zoom\.css$/, replacement: join(swiperRoot, 'modules/zoom.css') },
		],
		dedupe: ['react', 'react-dom', 'i18next', 'react-i18next', '@tanstack/react-query', '@rocket.chat/fuselage'],
	},
	define: {
		'process.env.TEST_MODE': JSON.stringify(process.env.TEST_MODE),
		'process.env.MESSAGE_MAX_PARSE_LENGTH': JSON.stringify(process.env.MESSAGE_MAX_PARSE_LENGTH),
	},
	css: {
		postcss: {
			plugins: [postcssEasyImport(), postcssCustomProperties({ preserve: true }), postcssMediaMinmax(), postcssNested(), autoprefixer()],
		},
	},
	build: {
		outDir: join(here, 'dist'),
		emptyOutDir: true,
		sourcemap: true,
	},
});
