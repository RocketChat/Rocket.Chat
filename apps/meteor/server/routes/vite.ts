import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';

import type { IncomingMessage } from 'connect';
import { WebApp } from 'meteor/webapp';

import { getWebAppHash } from '../configuration/configureBoilerplate';
import { SystemLogger } from '../lib/logger/system';

const frontendDeliveryMode = process.env.FRONTEND_DELIVERY_MODE ?? 'separate';
const ENABLED = frontendDeliveryMode === 'meteor';

SystemLogger.info(
	`Vite static route is ${ENABLED ? 'enabled' : 'disabled'} (FRONTEND_DELIVERY_MODE=${frontendDeliveryMode}, VITE_DIST_PATH=${process.env.VITE_DIST_PATH ?? 'unset'})`,
);

if (ENABLED) {
	const viteDistPath = await resolveViteDistPath();

	if (!viteDistPath) {
		SystemLogger.warn('FRONTEND_DELIVERY_MODE is meteor, but no Vite dist directory was found. Skipping Vite static handler.');
	} else {
		SystemLogger.info(`Serving Vite frontend from Meteor: ${viteDistPath}`);
		WebApp.connectHandlers.use(async (req, res, next) => {
			if (req.method !== 'GET' && req.method !== 'HEAD') {
				next();
				return;
			}

			const pathname = getPathname(req);
			if (!pathname || isBackendRoute(pathname)) {
				next();
				return;
			}

			const requestedFile = await resolvePublicFile(viteDistPath, pathname);
			if (requestedFile) {
				if (path.basename(requestedFile) === 'index.html') {
					await streamSpaIndexHtml(requestedFile, req, req.method, res);
					return;
				}

				await streamFile(requestedFile, req.method, res);
				return;
			}

			if (looksLikeAsset(pathname)) {
				next();
				return;
			}

			const fallbackPath = path.join(viteDistPath, 'index.html');
			if (!(await fileExists(fallbackPath))) {
				next();
				return;
			}

			await streamSpaIndexHtml(fallbackPath, req, req.method, res);
		});
	}
}

function getPathname(req: IncomingMessage): string | undefined {
	try {
		const host = req.headers.host ?? 'localhost';
		return new URL(req.url ?? '/', `http://${host}`).pathname;
	} catch {
		return undefined;
	}
}

function isBackendRoute(pathname: string): boolean {
	const backendPrefixes = [
		'/api',
		'/sockjs',
		'/websocket',
		'/_oauth',
		'/_saml',
		'/_timesync',
		'/file-upload',
		'/ufs',
		'/avatar',
		'/emoji-custom',
		'/custom-sounds',
		'/images',
		'/assets',
		'/i18n',
		'/livechat',
		'/health',
		'/livez',
		'/readyz',
		'/data-export',
		'/file-decrypt',
		'/meteor_runtime_config.js',
	];

	return backendPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function looksLikeAsset(pathname: string): boolean {
	return path.extname(pathname).length > 0;
}

async function resolveViteDistPath(): Promise<string | undefined> {
	const envPath = process.env.VITE_DIST_PATH;

	const paths = [
		envPath,
		path.resolve(process.cwd(), 'vite'),
		path.resolve(process.cwd(), '../vite'),
		path.resolve(process.cwd(), 'dist'),
		path.resolve(process.cwd(), '../dist'),
		path.resolve(process.cwd(), '../../../../../dist'),
	];

	console.debug('Checking for Vite dist directory in the following locations:', paths);

	const candidates = paths.filter((candidate): candidate is string => Boolean(candidate));

	const checks = await Promise.all(
		candidates.map(async (candidate) => {
			const absoluteCandidate = path.resolve(candidate);
			const hasDirectory = await directoryExists(absoluteCandidate);
			if (!hasDirectory) {
				return undefined;
			}

			const indexPath = path.join(absoluteCandidate, 'index.html');
			if (await fileExists(indexPath)) {
				return absoluteCandidate;
			}

			return undefined;
		}),
	);

	return checks.find((candidate): candidate is string => Boolean(candidate));
}

async function resolvePublicFile(baseDir: string, pathname: string): Promise<string | undefined> {
	const normalizedPath = pathname === '/' ? '/index.html' : pathname;
	const decodedPath = safeDecodeURIComponent(normalizedPath);
	if (!decodedPath) {
		return undefined;
	}

	const resolvedPath = path.resolve(baseDir, `.${decodedPath}`);
	if (!isInsideBaseDir(baseDir, resolvedPath)) {
		return undefined;
	}

	if (await fileExists(resolvedPath)) {
		return resolvedPath;
	}

	return undefined;
}

function isInsideBaseDir(baseDir: string, targetPath: string): boolean {
	const relative = path.relative(baseDir, targetPath);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function safeDecodeURIComponent(value: string): string | undefined {
	try {
		return decodeURIComponent(value);
	} catch {
		return undefined;
	}
}

async function streamFile(filePath: string, method: string | undefined, res: ServerResponse): Promise<void> {
	const fileStats = await stat(filePath);
	const ext = path.extname(filePath);

	res.setHeader('Content-Type', contentTypeByExtension[ext] ?? 'application/octet-stream');
	res.setHeader('Content-Length', String(fileStats.size));
	res.setHeader('Cache-Control', getCacheControl(filePath));

	if (method === 'HEAD') {
		res.writeHead(200);
		res.end();
		return;
	}

	await new Promise<void>((resolve, reject) => {
		const stream = createReadStream(filePath);
		stream.on('error', reject);
		stream.on('end', resolve);
		stream.pipe(res);
	});
}

async function streamSpaIndexHtml(indexPath: string, req: IncomingMessage, method: string | undefined, res: ServerResponse): Promise<void> {
	const rawHtml = await readFile(indexPath, 'utf8');
	const runtimeConfigPath = getRuntimeConfigScriptPath(req);
	const html = replaceInlineMeteorRuntimeConfig(rawHtml, runtimeConfigPath);

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));

	if (method === 'HEAD') {
		res.writeHead(200);
		res.end();
		return;
	}

	res.writeHead(200);
	res.end(html);
}

function replaceInlineMeteorRuntimeConfig(html: string, runtimeConfigPath: string): string {
	const inlineRuntimePattern =
		/<script[^>]*>\s*const\s+config\s*=\s*[\s\S]*?globalThis\.__meteor_runtime_config__\s*=\s*config;?\s*<\/script>/m;

	if (!inlineRuntimePattern.test(html)) {
		return html;
	}

	return html.replace(inlineRuntimePattern, `<script type="text/javascript" src="${runtimeConfigPath}"></script>`);
}

function getRuntimeConfigScriptPath(req: IncomingMessage): string {
	const { categorizeRequest } = WebApp as typeof WebApp & {
		categorizeRequest?: (request: IncomingMessage) => { arch?: string };
	};
	const { arch = 'web.browser' } = categorizeRequest?.(req) ?? {};
	const hash = getWebAppHash(arch) || getWebAppHash('web.browser');

	if (!hash) {
		return '/meteor_runtime_config.js';
	}

	return `/meteor_runtime_config.js?hash=${encodeURIComponent(hash)}`;
}

function getCacheControl(filePath: string): string {
	if (filePath.endsWith('index.html')) {
		return 'no-cache';
	}

	const fileName = path.basename(filePath);
	if (/\.[A-Za-z0-9_-]{8,}\./.test(fileName)) {
		return 'public, max-age=31536000, immutable';
	}

	return 'public, max-age=300';
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		const fileStat = await stat(filePath);
		return fileStat.isFile();
	} catch {
		return false;
	}
}

async function directoryExists(dirPath: string): Promise<boolean> {
	try {
		const dirStat = await stat(dirPath);
		return dirStat.isDirectory();
	} catch {
		return false;
	}
}

const contentTypeByExtension: Record<string, string> = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain; charset=utf-8',
	'.webmanifest': 'application/manifest+json; charset=utf-8',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
};
