import { basename, dirname } from 'node:path';

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
	input: 'src/index.ts',
	output: [
		{
			dir: dirname(pkg.main),
			entryFileNames: basename(pkg.main),
			format: 'cjs',
			sourcemap: true,
			strict: false,
		},
		{
			file: pkg.module,
			format: 'esm',
			sourcemap: true,
		},
	],
	plugins: [
		typescript({
			tsconfig: 'tsconfig.build.json',
		}),
		resolve(),
		commonjs(),
	],
});
