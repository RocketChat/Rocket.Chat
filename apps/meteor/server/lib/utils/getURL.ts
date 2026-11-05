import { getURLWithoutSettings } from '../../../lib/getURL';
import { settings } from '../../settings';

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
): string {
	const cdnPrefix = settings.get<string>('CDN_PREFIX') || '';
	const siteUrl = settings.get<string>('Site_Url') || '';

	return getURLWithoutSettings(path, params, cdnPrefix, siteUrl, __meteor_runtime_config__.ROOT_URL_PATH_PREFIX, cloudDeepLinkUrl);
};
