import { resolve } from 'node:path';

import preact from '@preact/preset-vite';
import { defineConfig, type UserConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

const isWidgetBuild = process.env.WIDGET_BUILD === 'true';

export default defineConfig(({ mode }) => {
	const commonConfig: UserConfig = {
		plugins: [
			preact(),
			svgr({
				svgrOptions: {
					// svgr options
				},
			}),
		],
		resolve: {
			extensions: ['.js', '.jsx', '.ts', '.tsx', '.scss'],
			alias: {
				'react': 'preact/compat',
				'react-dom': 'preact/compat',
			},
		},
		css: {
			preprocessorOptions: {
				scss: {},
			},
			modules: {
				localsConvention: 'camelCaseOnly',
				generateScopedName: '[local]__[hash:base64:5]',
			},
		},
	};

	if (isWidgetBuild) {
		return {
			...commonConfig,
			build: {
				lib: {
					entry: resolve(__dirname, 'src/widget.ts'),
					name: 'RocketChatLivechat',
					fileName: () => 'rocketchat-livechat.min.js',
					formats: ['iife'],
				},
				outDir: 'dist',
				emptyOutDir: false,
			},
		};
	}

	return {
		...commonConfig,
		build: {
			outDir: 'dist',
			emptyOutDir: true,
			rollupOptions: {
				input: {
					main: resolve(__dirname, 'index.html'),
				},
				output: {
					entryFileNames: `[name].[hash].js`,
					chunkFileNames: `[name].[hash].js`,
					assetFileNames: `[name].[hash].[ext]`,
				},
			},
		},
		server: {
			port: 8080,
		},
		base: mode === 'production' ? '/livechat/' : '/',
	};
});
