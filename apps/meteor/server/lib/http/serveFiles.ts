import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Readable } from 'node:stream';

import { compress } from '@rocket.chat/http-router';

import { httpApp } from './httpServer';
import { SystemLogger } from '../logger/system';

declare const __meteor_bootstrap__: { serverDir: string };

// Meteor's `require.resolve` answers with module ids rather than paths, so resolve the way Node does from the
// directory the server's npm packages are installed in. The server's own directory, not the working one: a bundle is
// started from its root, with the packages under `programs/server`.
const nodeRequire = createRequire(path.join(__meteor_bootstrap__.serverDir, 'npm', 'index.js'));

export const resolveInstalledFile = (specifier: string): string => nodeRequire.resolve(specifier);

export type ServedFile = () => string;

const CONTENT_TYPES: Record<string, string> = { '.js': 'text/javascript', '.wasm': 'application/wasm', '.jpg': 'image/jpeg' };

const isUnchanged = (ifModifiedSince: string | undefined, mtime: Date) => {
	const since = ifModifiedSince ? Date.parse(ifModifiedSince) : NaN;
	// HTTP dates have whole seconds.
	return !Number.isNaN(since) && Math.floor(mtime.getTime() / 1000) * 1000 <= since;
};

/**
 * Serves each of `files` by its name under `basePath`, and nothing else. The files are revalidated on every load rather
 * than kept for a while: their URLs carry no version, so an upgrade would otherwise pair a new client with old files.
 */
export const serveFiles = (basePath: string, files: ReadonlyMap<string, ServedFile>): void => {
	httpApp.get(`${__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''}${basePath}/:file`, compress(), async (c) => {
		const name = c.req.param('file');
		const resolve = files.get(name);
		if (!resolve) {
			return c.body(null, 404);
		}

		let filePath: string;
		try {
			filePath = resolve();
		} catch (err) {
			SystemLogger.error({ msg: 'A file the server serves is not installed', path: c.req.path, err });
			return c.body(null, 404);
		}

		const stats = await stat(filePath).catch(() => undefined);
		if (!stats?.isFile()) {
			return c.body(null, 404);
		}

		const cacheHeaders = { 'Cache-Control': 'no-cache', 'Last-Modified': stats.mtime.toUTCString() };
		if (isUnchanged(c.req.header('if-modified-since'), stats.mtime)) {
			return c.body(null, 304, cacheHeaders);
		}

		const headers = {
			...cacheHeaders,
			'Content-Type': CONTENT_TYPES[path.extname(filePath)] ?? 'application/octet-stream',
			'Content-Length': String(stats.size),
		};
		if (c.req.method === 'HEAD') {
			return c.body(null, 200, headers);
		}

		return c.body(Readable.toWeb(createReadStream(filePath)) as ReadableStream, 200, headers);
	});
};
