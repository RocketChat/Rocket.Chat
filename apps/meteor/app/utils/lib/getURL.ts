import { escapeRegExp } from '@rocket.chat/string-helpers';

import { isURL } from '../../../lib/utils/isURL';
import { ltrim, rtrim, trim } from '../../../lib/utils/stringUtils';

function getCloudUrl(
	path: string,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	_site_url: string,
	cloudRoute: string,
	cloudParams: Record<string, string> = {},
	deeplinkUrl = '',
): string {
	const cloudBaseUrl = deeplinkUrl.replace(/\/+$/, '');

	const siteUrl = rtrim(_site_url, '/');

	// Remove the protocol
	const host = siteUrl.replace(/https?\:\/\//i, '');
	path = ltrim(path, '/');

	Object.assign(cloudParams, {
		host,
		path,
	});

	if (siteUrl.includes('http://')) {
		cloudParams.secure = 'no';
	}

	const params = Object.entries(cloudParams)
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join('&');

	return `${cloudBaseUrl}/${cloudRoute}?${params}`;
}

export const _getURL = (
	path: string,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	{ cdn, full, cloud, cloud_route, cloud_params, _cdn_prefix, _root_url_path_prefix, _site_url }: Record<string, any>,
	deeplinkUrl?: string,
): string => {
	if (isURL(path)) {
		return path;
	}

	const [_path, _query] = path.split('?');
	path = _path;
	const query = _query ? `?${_query}` : '';

	const siteUrl = rtrim(trim(_site_url || ''), '/');
	const cloudRoute = trim(cloud_route || '');
	const cdnPrefix = rtrim(trim(_cdn_prefix || ''), '/');
	const pathPrefix = rtrim(trim(_root_url_path_prefix || ''), '/');

	const finalPath = ltrim(trim(path), '/');

	const url = rtrim(`${pathPrefix}/${finalPath}`, '/') + query;

	if (cloud) {
		const cloudParams = cloud_params || {};
		return getCloudUrl(url, siteUrl, cloudRoute, cloudParams, deeplinkUrl);
	}

	if (cdn && cdnPrefix !== '') {
		return cdnPrefix + url;
	}

	if (full) {
		return siteUrl.replace(new RegExp(`${escapeRegExp(pathPrefix)}$`), '') + url;
	}

	return url;
};

export const getURLWithoutSettings = (
	path: string,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	{
		cdn = true,
		full = false,
		cloud = false,
		cloud_route = '',
		cloud_params = {},
	}: {
		cdn?: boolean;
		full?: boolean;
		cloud?: boolean;
		cloud_route?: string;
		cloud_params?: Record<string, string>;
	},
	cdnPrefix: string,
	siteUrl: string,
	cloudDeepLinkUrl?: string,
): string =>
	_getURL(
		path,
		{
			cdn,
			full,
			cloud,
			cloud_route,
			cloud_params,
			_cdn_prefix: cdnPrefix,
			_root_url_path_prefix: __meteor_runtime_config__.ROOT_URL_PATH_PREFIX,
			_site_url: siteUrl,
		},
		cloudDeepLinkUrl,
	);
