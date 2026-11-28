import { getRootUrlPathPrefix } from '../../client/lib/meteorRuntimeConfig';
import { settings } from '../../client/lib/settings';
import { getURLWithoutSettings } from '../../lib/getURL';
import { Info } from '../../rocketchat.info';

// The standalone client proxies every server route through its own origin; full URLs built on the server's
// Site_Url would bypass that proxy and reach the server without the session cookies set on this origin.
// Cloud deep links still name the workspace by its Site_Url.
export const getURL = function (
	path: string,
	params: {
		cdn?: boolean;
		full?: boolean;
		cloud?: boolean;
		cloud_route?: string;
		cloud_params?: Record<string, string>;
	} = {},
	cloudDeepLinkUrl?: string,
	cacheKey?: boolean,
): string {
	const cdnPrefix = settings.peek('CDN_PREFIX') || '';
	const siteUrl = params.cloud ? settings.peek('Site_Url') || '' : window.location.origin;

	if (cacheKey) {
		path += `${path.includes('?') ? '&' : '?'}cacheKey=${Info.version}`;
	}

	return getURLWithoutSettings(path, params, cdnPrefix, siteUrl, getRootUrlPathPrefix(), cloudDeepLinkUrl);
};
