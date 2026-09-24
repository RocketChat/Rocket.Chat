import { basename, dirname, isAbsolute } from 'node:path';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

import pkg from './package.json' with { type: 'json' };

const declared = new Set(Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }));

const getPackageName = (id) =>
	id
		.split('/')
		.slice(0, id.startsWith('@') ? 2 : 1)
		.join('/');

// No package is bundled: every package import must be a declared dependency, loaded from the consumer's `node_modules`.
const external = (id, importer) => {
	if (!importer || id.startsWith('\0') || id.startsWith('.') || isAbsolute(id)) {
		return false;
	}

	if (declared.has(getPackageName(id))) {
		return true;
	}

	throw new Error(`"${id}" is imported but not declared as a dependency`);
};

export default defineConfig({
	external,
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
