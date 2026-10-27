import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pipeline } from 'node:stream';

import { WebApp } from 'meteor/webapp';

import { SystemLogger } from '../lib/logger/system';

// Meteor's `require.resolve` answers with module ids rather than paths, so resolve the way Node does from the
// directory the server's npm packages are installed in.
const nodeRequire = createRequire(path.join(process.cwd(), 'npm', 'index.js'));

/** Each file the route serves, by the package export it is published under: nothing else in the package is reachable. */
const FILES = new Map(
	Object.entries({
		'/rnnoise-worklet.js': { specifier: '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js', contentType: 'text/javascript' },
		'/rnnoise.wasm': { specifier: '@sapphi-red/web-noise-suppressor/rnnoise.wasm', contentType: 'application/wasm' },
		'/rnnoise_simd.wasm': { specifier: '@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm', contentType: 'application/wasm' },
	}),
);

/** Serves RNNoise to the conference window from the installed package, so clients never fetch it from a third party. */
WebApp.connectHandlers.use('/video-conference/rnnoise', async (req: IncomingMessage, res: ServerResponse) => {
	const asset = req.method === 'GET' || req.method === 'HEAD' ? FILES.get(new URL(req.url ?? '/', 'http://localhost').pathname) : undefined;
	if (!asset) {
		res.writeHead(404);
		res.end();
		return;
	}

	let filePath: string;
	try {
		filePath = nodeRequire.resolve(asset.specifier);
	} catch (err) {
		SystemLogger.error({ msg: 'RNNoise is not installed', err });
		res.writeHead(404);
		res.end();
		return;
	}

	const stats = await stat(filePath).catch(() => undefined);
	if (!stats?.isFile()) {
		res.writeHead(404);
		res.end();
		return;
	}

	// Revalidated on every load rather than kept for a while: the URL has no version, so an upgraded package would
	// otherwise be paired with an old worklet.
	const lastModified = stats.mtime.toUTCString();
	if (req.headers['if-modified-since'] === lastModified) {
		res.writeHead(304);
		res.end();
		return;
	}

	res.writeHead(200, {
		'Content-Type': asset.contentType,
		'Content-Length': stats.size,
		'Cache-Control': 'no-cache',
		'Last-Modified': lastModified,
	});
	if (req.method === 'HEAD') {
		res.end();
		return;
	}

	pipeline(createReadStream(filePath), res, (err) => err && SystemLogger.warn({ msg: 'RNNoise could not be sent', err }));
});
