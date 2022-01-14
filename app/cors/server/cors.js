import url from 'url';

import { Meteor } from 'meteor/meteor';
import { WebApp, WebAppInternals } from 'meteor/webapp';
import _ from 'underscore';

import { settings } from '../../settings/server';
import { Logger } from '../../logger';

const logger = new Logger('CORS');

settings.watch('Enable_CSP', (enabled) => {
	WebAppInternals.setInlineScriptsAllowed(!enabled);
});

WebApp.rawConnectHandlers.use(function (req, res, next) {
	// XSS Protection for old browsers (IE)
	res.setHeader('X-XSS-Protection', '1');

	// X-Content-Type-Options header to prevent MIME Sniffing
	res.setHeader('X-Content-Type-Options', 'nosniff');

	if (settings.get('Iframe_Restrict_Access')) {
		res.setHeader('X-Frame-Options', settings.get('Iframe_X_Frame_Options'));
	}

	if (settings.get('Enable_CSP')) {
		const cdn_prefixes = [settings.get('CDN_PREFIX'), settings.get('CDN_PREFIX_ALL') ? null : settings.get('CDN_JSCSS_PREFIX')]
			.filter(Boolean)
			.join(' ');

		const inlineHashes = [
			// Hash for `window.close()`, required by the CAS login popup.
			"'sha256-jqxtvDkBbRAl9Hpqv68WdNOieepg8tJSYu1xIy7zT34='",
		]
			.filter(Boolean)
			.join(' ');
		const external = [settings.get('Accounts_OAuth_Apple') && 'https://appleid.cdn-apple.com'].filter(Boolean).join(' ');
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
});

const _staticFilesMiddleware = WebAppInternals.staticFilesMiddleware;

WebAppInternals._staticFilesMiddleware = function (staticFiles, req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	return _staticFilesMiddleware(staticFiles, req, res, next);
};

const oldHttpServerListeners = WebApp.httpServer.listeners('request').slice(0);

WebApp.httpServer.removeAllListeners('request');

WebApp.httpServer.addListener('request', function (req, res, ...args) {
	const next = () => {
		for (const oldListener of oldHttpServerListeners) {
			oldListener.apply(WebApp.httpServer, [req, res, ...args]);
		}
	};

	if (settings.get('Force_SSL') !== true) {
		next();
		return;
	}

	const remoteAddress = req.connection.remoteAddress || req.socket.remoteAddress;
	const localhostRegexp = /^\s*(127\.0\.0\.1|::1)\s*$/;
	const localhostTest = function (x) {
		return localhostRegexp.test(x);
	};

	const isLocal =
		localhostRegexp.test(remoteAddress) &&
		(!req.headers['x-forwarded-for'] || _.all(req.headers['x-forwarded-for'].split(','), localhostTest));
	const isSsl = req.connection.pair || (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'].indexOf('https') !== -1);

	logger.debug('req.url', req.url);
	logger.debug('remoteAddress', remoteAddress);
	logger.debug('isLocal', isLocal);
	logger.debug('isSsl', isSsl);
	logger.debug('req.headers', req.headers);

	if (!isLocal && !isSsl) {
		let host = req.headers.host || url.parse(Meteor.absoluteUrl()).hostname;
		host = host.replace(/:\d+$/, '');
		res.writeHead(302, {
			Location: `https://${host}${req.url}`,
		});
		res.end();
		return;
	}

	return next();
});
