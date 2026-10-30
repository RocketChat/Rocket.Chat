import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

const require = createRequire(import.meta.url);
const sqliteDist = join(dirname(require.resolve('@sqlite.org/sqlite-wasm/package.json')), 'dist');

// The SQLite module finds its WebAssembly file next to itself (`new URL('sqlite3.wasm', import.meta.url)`), so the
// bundle and the .wasm file go to the same folder.
const emitSqliteWasm = () => ({
	name: 'emit-sqlite-wasm',
	generateBundle() {
		this.emitFile({ type: 'asset', fileName: 'sqlite3.wasm', source: readFileSync(join(sqliteDist, 'sqlite3.wasm')) });
	},
});

export default defineConfig({
	input: 'src/worker.ts',
	output: {
		file: 'dist/worker.mjs',
		format: 'esm',
		sourcemap: true,
	},
	plugins: [typescript({ tsconfig: 'tsconfig.json' }), resolve({ browser: true }), emitSqliteWasm()],
});
