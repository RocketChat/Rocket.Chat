import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Readable } from 'node:stream';

import { nodeHandler } from '@rocket.chat/http-router';
import type { Context } from 'hono';

import { nodeLoggerMiddleware } from '../api/v1/middlewares/logger';
import { httpApp } from '../lib/http/httpServer';
import { HttpLogger } from '../lib/logger/http';
import { SystemLogger } from '../lib/logger/system';

declare const __meteor_bootstrap__: { serverDir: string };

// Resolves from the server's npm directory, not the working one: a bundle runs from its root.
const nodeRequire = createRequire(path.join(__meteor_bootstrap__.serverDir, 'npm', 'index.js'));

const BASE = `${__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''}/video-conference/background-effects`;

/** The only runtime files served. */
const RUNTIME_FILES = new Map(
	Object.entries({
		'vision_wasm_internal.js': 'text/javascript',
		'vision_wasm_internal.wasm': 'application/wasm',
		'vision_wasm_nosimd_internal.js': 'text/javascript',
		'vision_wasm_nosimd_internal.wasm': 'application/wasm',
	}),
);

type Served = { file: string; contentType: string };

type Catalogue = {
	/** Every servable path below `BASE`, each carrying the version of what it serves. */
	files: Map<string, Served>;
	manifest: { runtime: string; model: string; presets: { id: string; path: string }[] };
};

const shortHash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex').slice(0, 16);

const reportedMissing = new Set<string>();

const reportMissing = (what: string, err?: unknown) => {
	if (reportedMissing.has(what)) {
		return;
	}
	reportedMissing.add(what);
	SystemLogger.error({ msg: 'A background effects file is missing from the installation', file: what, err });
};

const buildCatalogue = async (): Promise<Catalogue> => {
	const files = new Map<string, Served>();

	const tasksVisionMain = nodeRequire.resolve('@mediapipe/tasks-vision');
	const runtimeDir = path.join(path.dirname(tasksVisionMain), 'wasm');
	const { version: runtimeVersion } = JSON.parse(await readFile(path.join(path.dirname(tasksVisionMain), 'package.json'), 'utf8'));
	for (const [name, contentType] of RUNTIME_FILES) {
		files.set(`/runtime/${runtimeVersion}/${name}`, { file: path.join(runtimeDir, name), contentType });
	}

	const assets: typeof import('@rocket.chat/background-effects-assets') = nodeRequire('@rocket.chat/background-effects-assets');
	const modelPath = `/model/${assets.model.sha256.slice(0, 16)}/${assets.model.name}`;
	files.set(modelPath, { file: assets.model.file, contentType: 'application/octet-stream' });

	const presets = [];
	for (const preset of assets.presets) {
		const bytes = await readFile(preset.file).catch((err) => reportMissing(preset.file, err));
		if (!bytes) {
			continue;
		}
		const presetPath = `/presets/${shortHash(bytes)}/${path.basename(preset.file)}`;
		files.set(presetPath, { file: preset.file, contentType: preset.contentType });
		presets.push({ id: preset.id, path: presetPath.slice(1) });
	}

	return {
		files,
		manifest: { runtime: `runtime/${runtimeVersion}`, model: modelPath.slice(1), presets },
	};
};

let catalogue: Promise<Catalogue> | undefined;

const getCatalogue = () => {
	catalogue ??= buildCatalogue().catch((err) => {
		catalogue = undefined;
		throw err;
	});
	return catalogue;
};

const notFound = (c: Context) => c.body(null, 404);

/**
 * Serves the background effects' files from the installation, so clients never reach a third party and airgapped
 * workspaces work. File URLs are versioned and cached for a year; the manifest is revalidated.
 */
httpApp.all(`${BASE}/*`, nodeHandler(nodeLoggerMiddleware(HttpLogger)), async (c) => {
	if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
		return notFound(c);
	}

	let current: Catalogue;
	try {
		current = await getCatalogue();
	} catch (err) {
		reportMissing('@mediapipe/tasks-vision or @rocket.chat/background-effects-assets', err);
		return notFound(c);
	}

	const subpath = c.req.path.slice(BASE.length);

	if (subpath === '/manifest.json') {
		return c.json(current.manifest, 200, { 'Cache-Control': 'no-cache' });
	}

	const served = current.files.get(subpath);
	if (!served) {
		return notFound(c);
	}

	const stats = await stat(served.file).catch(() => undefined);
	if (!stats?.isFile()) {
		reportMissing(served.file);
		return notFound(c);
	}

	const headers = {
		'Content-Type': served.contentType,
		'Content-Length': String(stats.size),
		'Cache-Control': 'public, max-age=31536000, immutable',
	};
	if (c.req.method === 'HEAD') {
		return c.body(null, 200, headers);
	}

	const stream = createReadStream(served.file);
	stream.on('error', (err) => SystemLogger.warn({ msg: 'A background effects file could not be sent', file: served.file, err }));
	return c.body(Readable.toWeb(stream) as ReadableStream, 200, headers);
});
