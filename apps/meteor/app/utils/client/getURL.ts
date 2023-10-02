import { settings } from '../../settings/client';
import { getURLWithoutSettings } from '../lib/getURL';

export const getURL = function (
	path: string, // eslint-disable-next-line @typescript-eslint/naming-convention
	params: Record<string, any> = {},
	cloudDeepLinkUrl?: string,
): string {
	const cdnPrefix = settings.get('CDN_PREFIX') || '';
	const siteUrl = settings.get('Site_Url') || '';

	return getURLWithoutSettings(path, params, cdnPrefix, siteUrl, cloudDeepLinkUrl);
};
