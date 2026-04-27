// There is a good chance this module may be promoted to root lib/ in the future

import { baseURI } from './baseURI';

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
} as AbsoluteUrlOptions;

const { defaultOptions } = absoluteUrl;
const location = typeof window === 'object' && window.location;
if (typeof __meteor_runtime_config__ === 'object' && __meteor_runtime_config__.ROOT_URL) {
	defaultOptions.rootUrl = __meteor_runtime_config__.ROOT_URL;
} else if (location && location.protocol && location.host) {
	defaultOptions.rootUrl = `${location.protocol}//${location.host}`;
}
if (location && location.protocol === 'https:') {
	defaultOptions.secure = true;
}

export function _relativeToSiteRootUrl(link: string): string {
	if (typeof __meteor_runtime_config__ === 'object' && link.slice(0, 1) === '/') {
		link = (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '') + link;
	}

	return link;
}
