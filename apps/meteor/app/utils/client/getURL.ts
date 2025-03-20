import { settings } from '../../settings/client';
import { getURLWithoutSettings } from '../lib/getURL';
import { Info } from '../rocketchat.info';

export const getURL = function (
	path: string, // eslint-disable-next-line @typescript-eslint/naming-convention
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
	const cdnPrefix = settings.get('CDN_PREFIX') || '';
	const siteUrl = settings.get('Site_Url') || '';

	if (cacheKey) {
		path += `${path.includes('?') ? '&' : '?'}cacheKey=${Info.version}`;
	}

	return getURLWithoutSettings(path, params, cdnPrefix, siteUrl, cloudDeepLinkUrl);
};
