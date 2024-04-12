import crypto from 'crypto';

import type { NextHandleFunction } from 'connect';
import { Inject } from 'meteor/meteorhacks:inject-initial';
import { ReactiveDict } from 'meteor/reactive-dict';
import { WebApp } from 'meteor/webapp';
import parseRequest from 'parseurl';

import { getURL } from '../../utils/server/getURL';

type Injection =
	| string
	| {
			content: string;
			type: 'JS' | 'CSS';
			tag: string;
	  };

export const headInjections = new ReactiveDict();

const callback: NextHandleFunction = (req, res, next) => {
	if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
		next();
		return;
	}
	try {
		const rawPath = parseRequest(req);
		const pathname = rawPath?.pathname && decodeURIComponent(rawPath.pathname);

		if (!pathname) {
			next();
			return;
		}

		const injection = headInjections.get(pathname.replace(/^\//, '').split('_')[0]) as Injection | undefined;

		if (!injection || typeof injection === 'string') {
			next();
			return;
		}

		const serve =
			(contentType: string) =>
			(content: string, cacheControl = 'public, max-age=31536000'): void => {
				res.writeHead(200, {
					'Content-type': contentType,
					'cache-control': cacheControl,
					'Content-Length': content.length,
				});
				res.write(content);
				res.end();
			};

		const serveStaticJS = serve('application/javascript; charset=UTF-8');
		const serveStaticCSS = serve('text/css; charset=UTF-8');

		if (injection.type === 'JS') {
			serveStaticJS(injection.content);
			return;
		}

		if (injection.type === 'CSS') {
			serveStaticCSS(injection.content);
			return;
		}
		next();
	} catch (e) {
		next();
	}
};

WebApp.connectHandlers.use(callback);

export const injectIntoHead = (key: string, value: Injection): void => {
	headInjections.set(key, value);
};

export const addScript = (key: string, content: string): void => {
	if (/_/.test(key)) {
		throw new Error('inject.js > addScript - key cannot contain "_" (underscore)');
	}

	if (!content.trim()) {
		injectIntoHead(key, '');
		return;
	}
	const currentHash = crypto.createHash('sha1').update(content).digest('hex');

	injectIntoHead(key, {
		type: 'JS',
		tag: `<script id="${key}" type="text/javascript" src="${`${getURL(key)}_${currentHash}.js`}"></script>`,
		content,
	});
};

export const addStyle = (key: string, content: string): void => {
	if (/_/.test(key)) {
		throw new Error('inject.js > addStyle - key cannot contain "_" (underscore)');
	}

	if (!content.trim()) {
		injectIntoHead(key, '');
		return;
	}
	const currentHash = crypto.createHash('sha1').update(content).digest('hex');

	injectIntoHead(key, {
		type: 'CSS',
		tag: `<link id="${key}" rel="stylesheet" type="text/css" href="${`${getURL(key)}_${currentHash}.css`}">`,
		content,
	});
};

export const injectIntoBody = (key: string, value: string): void => {
	Inject.rawBody(key, value);
};

export const applyHeadInjections = (injections: Injection[]): ((html: string) => string) => {
	if (injections.length === 0) {
		return (html: string): string => html;
	}

	const replacementHtml = `${injections
		.map((i) => {
			if (typeof i === 'string') {
				return i;
			}
			return i.content.trim().length > 0 ? i.tag : '';
		})
		.join('\n')
		.replace(/\$/g, '$$$$')}\n</head>`;

	return (html: string): string => html.replace('</head>', replacementHtml);
};
