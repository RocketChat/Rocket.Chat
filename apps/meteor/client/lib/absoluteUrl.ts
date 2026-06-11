// There is a good chance this module may be promoted to root lib/ in the future

import { baseURI } from './baseURI';
import { getRootUrlPathPrefix } from './meteorRuntimeConfig';

type AbsoluteUrlOptions = {
	rootUrl?: string;
	secure?: boolean;
	replaceLocalhost?: boolean;
};

export function absoluteUrl(path?: string, options?: AbsoluteUrlOptions): string {
	if (!options && typeof path === 'object') {
		options = path;
		path = undefined;
	}

	options = { ...absoluteUrl.defaultOptions, ...options };

	let { rootUrl } = options;

	if (!rootUrl) throw Error('Must pass options.rootUrl or set ROOT_URL in the server environment');

	if (!/^http[s]?:\/\//i.test(rootUrl)) {
		rootUrl = `http://${rootUrl}`;
	}

	if (!rootUrl.endsWith('/')) {
		rootUrl += '/';
	}

	if (path) {
		while (path.startsWith('/')) path = path.slice(1);
		rootUrl += path;
	}

	if (options.secure && /^http:/.test(rootUrl) && !/http:\/\/localhost[:/]/.test(rootUrl) && !/http:\/\/127\.0\.0\.1[:/]/.test(rootUrl)) {
		rootUrl = rootUrl.replace(/^http:/, 'https:');
	}

	if (options.replaceLocalhost) {
		rootUrl = rootUrl.replace(/^http:\/\/localhost([:/].*)/, 'http://127.0.0.1$1');
	}

	return rootUrl;
}

absoluteUrl.defaultOptions = {
	rootUrl: baseURI,
	secure: window.isSecureContext,
} as AbsoluteUrlOptions;

export function _relativeToSiteRootUrl(link: string): string {
	if (link.startsWith('/')) {
		link = getRootUrlPathPrefix() + link;
	}

	return link;
}
