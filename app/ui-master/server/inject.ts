import crypto from 'crypto';

import parseRequest from 'parseurl';
import { NextHandleFunction } from 'connect';
import { WebApp } from 'meteor/webapp';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Inject } from 'meteor/meteorhacks:inject-initial';

import { getURL } from '../../utils/server';

type Injection = string | {
	content: string;
	type: 'JS' | 'CSS';
	tag: string;
}

export const headInjections = new ReactiveDict();

const callback: NextHandleFunction = (req, res, next) => {
	if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
		next();
		return;
	}
	try {
		const rawPath = parseRequest(req);
		const pathname = rawPath !== undefined && rawPath.pathname && decodeURIComponent(rawPath.pathname);

		if (!pathname) {
			next();
			return;
		}

		const injection = headInjections.get(pathname.replace(/^\//, '')) as Injection | undefined;

		if (!injection || typeof injection === 'string') {
			next();
			return;
		}

		const serve = (contentType: string) => (content: string, cacheControl = 'public, max-age=31536000'): void => {
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
	if (!content.trim()) {
		injectIntoHead(`${ key }.js`, '');
		return;
	}
	const currentHash = crypto.createHash('sha1').update(content).digest('hex');
	injectIntoHead(`${ key }.js`, { type: 'JS', tag: `<script id="${ key }" type="text/javascript" src="${ `${ getURL(key) }.js?${ currentHash }` }"></script>`, content });
};

export const addStyle = (key: string, content: string): void => {
	if (!content.trim()) {
		injectIntoHead(`${ key }.css`, '');
		return;
	}
	const currentHash = crypto.createHash('sha1').update(content).digest('hex');
	injectIntoHead(`${ key }.css`, { type: 'CSS', tag: `<link id="${ key }" rel="stylesheet" type="text/css" href="${ `${ getURL(key) }.css?${ currentHash }` }">`, content });
};

export const injectIntoBody = (key: string, value: string): void => {
	Inject.rawBody(key, value);
};

export const applyHeadInjections = (injections: Injection[]): (html: string) => string => {
	if (injections.length === 0) {
		return (html: string): string => html;
	}

	const replacementHtml = `${ injections.map((i) => {
		if (typeof i === 'string') {
			return i;
		}
		return i.content.trim().length > 0 ? i.tag : '';
	}).join('\n').replace(/\$/g, '$$$$') }\n</head>`;

	return (html: string): string => html.replace('</head>', replacementHtml);
};
