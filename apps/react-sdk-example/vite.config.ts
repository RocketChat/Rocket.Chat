import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({}) => ({
	logLevel: 'error',
	plugins: [react()],
	optimizeDeps: {
		include: ['@rocket.chat/ui-contexts', '@rocket.chat/ddp-client'],
	},
	build: {
		commonjsOptions: {
			include: [/@rocket.chat\/ui-contexts/, /@rocket.chat\/ddp-client/, /node_modules/],
		},
	},
}));
