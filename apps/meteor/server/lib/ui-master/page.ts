import { createHash } from 'node:crypto';

import { RoutePolicy } from 'meteor/routepolicy';
import { WebApp } from 'meteor/webapp';

import { applyHeadInjections, bodyInjections, headInjections } from './inject';

// The page the server answers for every client route: the head and body injections, then the runtime config.
// The config is an external script so that a Content-Security-Policy without 'unsafe-inline' allows it.

let runtimeConfigScript: { content: string; hash: string } | undefined;

export const getRuntimeConfigScript = (): { content: string; hash: string } => {
	const content = `__meteor_runtime_config__ = ${JSON.stringify({ ...__meteor_runtime_config__, isModern: true })};`;
	if (runtimeConfigScript?.content !== content) {
		runtimeConfigScript = { content, hash: createHash('sha1').update(content).digest('hex') };
	}
	return runtimeConfigScript;
};

export const renderPage = (): string => {
	const injections = Object.values(headInjections.all()).filter((injection): injection is NonNullable<typeof injection> => !!injection);
	const { hash } = getRuntimeConfigScript();

	return applyHeadInjections(injections)(
		[
			'<!DOCTYPE html>',
			'<html>',
			'<head>',
			'</head>',
			'<body>',
			...bodyInjections.values(),
			`<script type="text/javascript" src="${__meteor_runtime_config__.ROOT_URL_PATH_PREFIX}/meteor_runtime_config.js?hash=${hash}"></script>`,
			'</body>',
			'</html>',
		].join('\n'),
	);
};

// Same routes Meteor answered with its page: everything but the well-known files and the routes a server handler owns.
const isPageUrl = (url: string): boolean =>
	url !== '/favicon.ico' && url !== '/robots.txt' && url !== '/app.manifest' && !RoutePolicy.classify(url);

// Registered once the server listens, after every handler the server adds while it starts, as Meteor's page was.
WebApp.onListening(() => {
	WebApp.connectHandlers.use((req, res, next) => {
		if (!req.url || !isPageUrl(req.url)) {
			next();
			return;
		}

		if (req.method !== 'GET' && req.method !== 'HEAD') {
			res.writeHead(req.method === 'OPTIONS' ? 200 : 405, { 'Allow': 'OPTIONS, GET, HEAD', 'Content-Length': '0' });
			res.end();
			return;
		}

		res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
		res.end(req.method === 'HEAD' ? undefined : renderPage());
	});
});
