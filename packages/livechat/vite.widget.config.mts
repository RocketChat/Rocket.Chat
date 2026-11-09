import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));

// The embed script host pages load with a classic `<script>`, written next to the widget's files.
export default defineConfig({
	publicDir: false,
	build: {
		outDir: join(here, 'dist'),
		emptyOutDir: false,
		sourcemap: true,
		rolldownOptions: {
			input: join(here, 'src/widget.ts'),
			output: {
				format: 'iife',
				entryFileNames: 'rocketchat-livechat.min.js',
			},
		},
	},
});
