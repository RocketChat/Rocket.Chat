import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(() => ({
	base: './',
	esbuild: {},
	plugins: [react()],
	optimizeDeps: {
		include: ['@rocket.chat/ui-contexts', '@rocket.chat/message-parser', '@rocket.chat/core-typings'],
	},
	build: {
		commonjsOptions: {
			include: [/ui-contexts/, /core-typings/, /message-parser/, /node_modules/],
		},
	},
}));
