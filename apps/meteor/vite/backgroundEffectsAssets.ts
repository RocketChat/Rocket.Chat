import { createReadStream, readFileSync, statSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';

import type { Connect, Plugin } from 'vite';

// Testing aid: the dev and preview servers serve the background effects' files themselves, so the client works against
// an RC_SERVER_URL that does not serve them.

const require = createRequire(import.meta.url);

const BASE = '/video-conference/background-effects';

const RUNTIME_FILES: Record<string, string> = {
	'vision_wasm_internal.js': 'text/javascript',
	'vision_wasm_internal.wasm': 'application/wasm',
	'vision_wasm_nosimd_internal.js': 'text/javascript',
	'vision_wasm_nosimd_internal.wasm': 'application/wasm',
};

type Served = { file: string; contentType: string };

const buildCatalogue = () => {
	const files = new Map<string, Served>();

	const tasksVisionDir = dirname(require.resolve('@mediapipe/tasks-vision'));
	const { version } = JSON.parse(readFileSync(join(tasksVisionDir, 'package.json'), 'utf8'));
	for (const [name, contentType] of Object.entries(RUNTIME_FILES)) {
		files.set(`/runtime/${version}/${name}`, { file: join(tasksVisionDir, 'wasm', name), contentType });
	}

	const assets: typeof import('@rocket.chat/background-effects-assets') = require('@rocket.chat/background-effects-assets');
	const modelPath = `/model/${assets.model.sha256.slice(0, 16)}/${assets.model.name}`;
	files.set(modelPath, { file: assets.model.file, contentType: 'application/octet-stream' });

	const presets = assets.presets.map((preset) => {
		const presetPath = `/presets/${preset.id}/${basename(preset.file)}`;
		files.set(presetPath, { file: preset.file, contentType: preset.contentType });
		return { id: preset.id, path: presetPath.slice(1) };
	});

	return { files, manifest: JSON.stringify({ runtime: `runtime/${version}`, model: modelPath.slice(1), presets }) };
};

const notFound = (res: ServerResponse) => {
	res.statusCode = 404;
	res.end();
};

const handler = (): Connect.NextHandleFunction => {
	let catalogue: ReturnType<typeof buildCatalogue> | undefined;

	return (req, res) => {
		if (req.method !== 'GET' && req.method !== 'HEAD') {
			return notFound(res);
		}
		catalogue ??= buildCatalogue();
		const subpath = new URL(req.url ?? '/', 'http://localhost').pathname;

		if (subpath === '/manifest.json') {
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Cache-Control', 'no-cache');
			res.end(catalogue.manifest);
			return;
		}

		const served = catalogue.files.get(subpath);
		const size = served && statSync(served.file, { throwIfNoEntry: false })?.size;
		if (!served || size === undefined) {
			return notFound(res);
		}
		res.setHeader('Content-Type', served.contentType);
		res.setHeader('Content-Length', String(size));
		res.setHeader('Cache-Control', 'no-cache');
		if (req.method === 'HEAD') {
			res.end();
			return;
		}
		createReadStream(served.file).pipe(res);
	};
};

export const backgroundEffectsAssets = (): Plugin => ({
	name: 'rocketchat:background-effects-assets',
	configureServer(server) {
		server.middlewares.use(BASE, handler());
	},
	configurePreviewServer(server) {
		server.middlewares.use(BASE, handler());
	},
});
