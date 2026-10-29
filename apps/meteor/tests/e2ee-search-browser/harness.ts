import { createReadStream, mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

import { build } from 'esbuild';

const PUBLIC_DIR = resolve(__dirname, '../../public');
const TYPES: Record<string, string> = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.wasm': 'application/wasm',
};

/** Builds the test page and serves it with the E2EE search worker files. It needs no Rocket.Chat server. */
export const startHarnessServer = async (): Promise<{ url: string; close: () => void }> => {
	const outDir = mkdtempSync(join(tmpdir(), 'e2ee-search-browser-'));
	await build({ entryPoints: [join(__dirname, 'pageEntry.ts')], bundle: true, format: 'esm', outfile: join(outDir, 'page.js') });

	// A worker whose browser refuses OPFS, like a private window: the first module breaks getDirectory before the worker
	// module runs. Only the specs load it.
	const TEST_MODULES: Record<string, string> = {
		'/test/refuse-storage.mjs':
			"StorageManager.prototype.getDirectory = () => Promise.reject(new DOMException('The storage is refused', 'SecurityError'));",
		'/test/refused-storage-worker.mjs': "import './refuse-storage.mjs';\nimport '../workers/e2ee-search/worker.mjs';",
	};

	const fileFor = (path: string): string | undefined => {
		if (path === '/page.js') return join(outDir, 'page.js');
		if (path.startsWith('/workers/e2ee-search/')) return join(PUBLIC_DIR, path);
		return undefined;
	};

	const server: Server = createServer((request, response) => {
		const path = new URL(request.url ?? '/', 'http://localhost').pathname;
		if (path === '/') {
			response.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><script type="module" src="/page.js"></script>');
			return;
		}
		if (path in TEST_MODULES) {
			response.writeHead(200, { 'Content-Type': 'text/javascript' }).end(TEST_MODULES[path]);
			return;
		}
		const file = fileFor(path);
		if (!file) {
			response.writeHead(404).end();
			return;
		}
		response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
		createReadStream(file).pipe(response);
	});
	await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
	const address = server.address();
	const port = typeof address === 'object' && address ? address.port : 0;
	return {
		url: `http://127.0.0.1:${port}/`,
		close: () => {
			server.close();
			rmSync(outDir, { recursive: true, force: true });
		},
	};
};

export type TestWindow = Window & {
	e2eeSearchTest: {
		create: (namespace: string, workerUrl?: string) => number;
		canRun: () => boolean;
		createShared: (namespace: string) => number;
		isLeader: (id: number) => boolean;
		call: (id: number, method: string, args: unknown[]) => Promise<unknown>;
		flush: (id: number) => Promise<void>;
	};
};

/**
 * A 32-byte wrap key, as the web client derives it from the E2EE private key after the unlock. Each call gives a new
 * copy. A different `fill` gives the key of another private key.
 */
export const wrapKey = (fill = 7): Uint8Array => new Uint8Array(32).fill(fill);
