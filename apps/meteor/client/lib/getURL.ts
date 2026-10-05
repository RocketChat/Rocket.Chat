import { settings } from './settings';
import { getURLWithoutSettings } from '../../app/utils/lib/getURL';
import { Info } from '../../app/utils/rocketchat.info';

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

	if (cacheKey) {
		path += `${path.includes('?') ? '&' : '?'}cacheKey=${Info.version}`;
	}

	return getURLWithoutSettings(path, params, cdnPrefix, siteUrl, cloudDeepLinkUrl);
};
