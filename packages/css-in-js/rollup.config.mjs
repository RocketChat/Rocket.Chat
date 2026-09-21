import { basename, dirname } from 'node:path';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
	external: ['@emotion/hash', '@rocket.chat/memo', '@rocket.chat/css-supports', '@rocket.chat/stylis-logical-props-middleware'],
	input: 'src/index.ts',
	output: [
		{
			dir: dirname(pkg.main),
			entryFileNames: basename(pkg.main),
			format: 'cjs',
			sourcemap: true,
			interop: 'compat',
		},
		{
			dir: dirname(pkg.module),
			entryFileNames: basename(pkg.module),
			format: 'es',
			sourcemap: true,
		},
	],
	plugins: [
		terser({
			compress: true,
			mangle: true,
			module: true,
			output: {
				comments: false,
			},
		}),
		json(),
		nodeResolve(),
		commonjs(),
		typescript({
			tsconfig: './tsconfig.build.json',
		}),
	],
});
