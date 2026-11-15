import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
	input: 'src/index.ts',
	output: [
		{
			file: pkg.main,
			format: 'cjs',
			sourcemap: true,
		},
		{
			file: pkg.module,
			format: 'es',
			sourcemap: true,
		},
	],
	plugins: [
		typescript({
			tsconfig: './tsconfig.build.json',
		}),
		terser({
			module: true,
			output: {
				comments: false,
			},
		}),
	],
});
