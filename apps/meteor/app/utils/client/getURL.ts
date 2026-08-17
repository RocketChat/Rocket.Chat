import { settings } from '../../../client/lib/settings';
import { getURLWithoutSettings } from '../lib/getURL';
import { Info } from '../rocketchat.info';

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
	const siteUrl = settings.peek('Site_Url') || '';

	const isLocalhost =
		typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

	const resolvedSiteUrl = params.full && isLocalhost ? window.location.origin : siteUrl;

	if (cacheKey) {
		path += `${path.includes('?') ? '&' : '?'}cacheKey=${Info.version}`;
	}

	return getURLWithoutSettings(path, params, cdnPrefix, resolvedSiteUrl, cloudDeepLinkUrl);
};
