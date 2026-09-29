import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

import { WebApp } from 'meteor/webapp';

import type { VideoConferenceAssetRoots } from './resolveVideoConferenceAsset';
import { resolveVideoConferenceAsset } from './resolveVideoConferenceAsset';
import { SystemLogger } from '../../lib/logger/system';

const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60;

// Meteor's `require.resolve` answers with module ids rather than paths, so resolve the way Node does from the
// directory the server's npm packages are installed in.
const nodeRequire = createRequire(path.join(process.cwd(), 'npm', 'index.js'));

let roots: VideoConferenceAssetRoots | undefined;

const getRoots = (): VideoConferenceAssetRoots => {
	roots ??= {
		mediapipe: path.dirname(nodeRequire.resolve('@mediapipe/tasks-vision')),
		rnnoise: path.dirname(nodeRequire.resolve('@sapphi-red/web-noise-suppressor/rnnoise.wasm')),
		mediaProcessors: path.dirname(nodeRequire.resolve('@rocket.chat/media-processors/package.json')),
	};
	return roots;
};

const notFound = (res: ServerResponse) => {
	res.writeHead(404);
	res.end();
};

/** Serves the background blur and noise suppression runtime from the installed packages, read-only. */
const videoConferenceAssetsHandler = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		res.writeHead(405, { Allow: 'GET, HEAD' });
		res.end();
		return;
	}

	const { pathname } = new URL(req.url ?? '/', 'http://localhost');

	let asset: ReturnType<typeof resolveVideoConferenceAsset>;
	try {
		asset = resolveVideoConferenceAsset(getRoots(), pathname);
	} catch (err) {
		SystemLogger.error({ msg: 'Video conference assets are not installed', err });
		return notFound(res);
	}

	if (!asset) {
		return notFound(res);
	}

	const stats = await stat(asset.filePath).catch(() => undefined);
	if (!stats?.isFile()) {
		return notFound(res);
	}

	const lastModified = stats.mtime.toUTCString();
	res.setHeader('Cache-Control', `public, max-age=${ONE_WEEK_IN_SECONDS}`);
	res.setHeader('Last-Modified', lastModified);

	if (req.headers['if-modified-since'] === lastModified) {
		res.writeHead(304);
		res.end();
		return;
	}

	res.setHeader('Content-Type', asset.contentType);
	res.setHeader('Content-Length', stats.size);
	res.writeHead(200);

	if (req.method === 'HEAD') {
		res.end();
		return;
	}

	createReadStream(asset.filePath).pipe(res);
};

WebApp.connectHandlers.use('/video-conference/assets/', videoConferenceAssetsHandler);
