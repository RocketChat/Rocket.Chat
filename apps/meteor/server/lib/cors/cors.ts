import type http from 'node:http';
import url from 'node:url';

import type { RootMiddleware } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import type { StaticFiles } from 'meteor/webapp';
import { WebApp, WebAppInternals } from 'meteor/webapp';

import { getWebAppHash } from '../../configuration/configureBoilerplate';
import { settings } from '../../settings';
import { getWorkspaceURL } from '../utils/getURL';

// Taken from 'connect' types
type NextFunction = (err?: any) => void;

const logger = new Logger('CORS');

let templatePromise: Promise<void> | void;
export async function setInlineScriptsAllowed(allowed: boolean): Promise<void> {
	templatePromise = WebAppInternals.setInlineScriptsAllowed(allowed);
}

const localhostRegexp = /^\s*(127\.0\.0\.1|::1)\s*$/;
const isLocalhost = (address: string) => localhostRegexp.test(address);

export const forceSsl: RootMiddleware = async (c, next) => {
	if (settings.get('Force_SSL') !== true) {
		return next();
	}

	const req = c.env.incoming;
	const remoteAddress = req.socket.remoteAddress || '';
	const isLocal =
		isLocalhost(remoteAddress) &&
		(!req.headers['x-forwarded-for'] || (req.headers['x-forwarded-for'] as string).split(',').every(isLocalhost));
	// @ts-expect-error - `pair` is valid, but doesnt exists on types
	const isSsl = req.socket.pair || (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'].indexOf('https') !== -1);

	logger.debug({ msg: 'CORS request info', url: req.url, remoteAddress, isLocal, isSsl, headers: req.headers });

	if (!isLocal && !isSsl) {
		let host = req.headers.host || url.parse(getWorkspaceURL()).hostname || '';
		host = host.replace(/:\d+$/, '');
		return c.redirect(`https://${host}${req.url}`, 302);
	}

	return next();
};

// set on the node response so they reach both our routes and the ones Meteor still answers
export const securityHeaders: RootMiddleware = async (c, next) => {
	const res = c.env.outgoing;
	if (templatePromise) {
		await templatePromise;
		templatePromise = void 0;
	}

	// XSS Protection for old browsers (IE)
	res.setHeader('X-XSS-Protection', '1');

	// X-Content-Type-Options header to prevent MIME Sniffing
	res.setHeader('X-Content-Type-Options', 'nosniff');

	if (settings.get('Iframe_Restrict_Access')) {
		res.setHeader('X-Frame-Options', settings.get<string>('Iframe_X_Frame_Options'));
	}

	if (settings.get<boolean>('Enable_CSP')) {
		const cdn_prefixes = [
			settings.get<string>('CDN_PREFIX'),
			settings.get<string>('CDN_PREFIX_ALL') ? null : settings.get<string>('CDN_JSCSS_PREFIX'),
			'https://cdn.zapier.com',
		]
			.filter(Boolean)
			.join(' ');

		const inlineHashes = [
			// Hash for `window.close()`, required by the CAS login popup.
			"'sha256-jqxtvDkBbRAl9Hpqv68WdNOieepg8tJSYu1xIy7zT34='",
			// Hash for /apps/meteor/packages/rocketchat-livechat/assets/demo.html:25
			"'sha256-aui5xYk3Lu1dQcnsPlNZI+qDTdfzdUv3fzsw80VLJgw='",
		]
			.filter(Boolean)
			.join(' ');
		const external = [
			settings.get<boolean>('Accounts_OAuth_Apple') && 'https://appleid.cdn-apple.com',
			settings.get<boolean>('PiwikAnalytics_enabled') && settings.get('PiwikAnalytics_url'),
			settings.get<boolean>('GoogleAnalytics_enabled') && 'https://www.google-analytics.com',
			'https://zapier.com',
			...settings
				.get<string>('Extra_CSP_Domains')
				.split(/[ \n\,]/gim)
				.filter((e) => Boolean(e.trim())),
		]
			.filter(Boolean)
			.join(' ');
		res.setHeader(
			'Content-Security-Policy',
			[
				`default-src 'self' ${cdn_prefixes}`,
				'connect-src *',
				`font-src 'self' ${cdn_prefixes} data:`,
				'frame-src *',
				'img-src * data: blob:',
				'media-src * data:',
				`script-src 'self' 'unsafe-eval' ${inlineHashes} ${cdn_prefixes} ${external}`,
				`style-src 'self' 'unsafe-inline' ${cdn_prefixes}`,
			].join('; '),
		);
	}

	return next();
};

const _staticFilesMiddleware = WebAppInternals.staticFilesMiddleware;

let cachingVersion = '';
export function setCachingVersion(value: string): void {
	cachingVersion = value.trim();
}

// @ts-expect-error - accessing internal property of webapp
WebAppInternals.staticFilesMiddleware = function (
	staticFiles: StaticFiles,
	req: http.IncomingMessage & { cookies: Record<string, string> },
	res: http.ServerResponse & { cookie: (cookie: string, value: string) => void },
	next: NextFunction,
) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	const { arch, path, url } = WebApp.categorizeRequest(req);

	if (cachingVersion && req.cookies.cache_version !== cachingVersion) {
		res.cookie('cache_version', cachingVersion);
		res.setHeader('Clear-Site-Data', '"cache"');
	}

	// Prevent meteor_runtime_config.js to load from a different expected hash possibly causing
	// a cache of the file for the wrong hash and start a client loop due to the mismatch
	// of the hashes of ui versions which would be checked against a websocket response
	if (path === '/meteor_runtime_config.js') {
		const hash = getWebAppHash(arch);

		if (!hash || hash !== url.query.hash) {
			res.writeHead(404);
			return res.end();
		}

		res.setHeader('Cache-Control', 'public, max-age=3600');
	}

	// The web client's files are named by their content hash, so they never change under the same URL.
	if (path.startsWith('/bundle/')) {
		res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
	}

	return _staticFilesMiddleware(staticFiles, req, res, next);
};

// A chunk missing from the build must fail to load, not be cached for good as the page.
WebApp.connectHandlers.use('/bundle/', (_req: http.IncomingMessage, res: http.ServerResponse) => {
	res.writeHead(404, { 'Cache-Control': 'no-cache' });
	res.end();
});
