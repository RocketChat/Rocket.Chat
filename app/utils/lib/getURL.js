import s from 'underscore.string';

import { isURL } from './isURL';
import { settings } from '../../settings';

function getCloudUrl(path, _site_url, cloudRoute, cloudParams = {}) {
	const cloudBaseUrl = (settings.get('DeepLink_Url') || '').replace(/\/+$/, '');

	const siteUrl = s.rtrim(_site_url, '/');

	// Remove the protocol
	const host = siteUrl.replace(/https?\:\/\//i, '');
	path = s.ltrim(path, '/');

	Object.assign(cloudParams, {
		host,
		path,
	});

	if (siteUrl.includes('http://')) {
		cloudParams.secure = 'no';
	}

	const params = Object.entries(cloudParams).map(([key, value]) => `${ key }=${ encodeURIComponent(value) }`).join('&');

	return `${ cloudBaseUrl }/${ cloudRoute }?${ params }`;
}

export const _getURL = (path, { cdn, full, cloud, cloud_route, cloud_params, _cdn_prefix, _root_url_path_prefix, _site_url }) => {
	if (isURL(path)) {
		return path;
	}

	const [_path, _query] = path.split('?');
	path = _path;
	const query = _query ? `?${ _query }` : '';

	const siteUrl = s.rtrim(s.trim(_site_url || ''), '/');
	const cloudRoute = s.trim(cloud_route || '');
	const cdnPrefix = s.rtrim(s.trim(_cdn_prefix || ''), '/');
	const pathPrefix = s.rtrim(s.trim(_root_url_path_prefix || ''), '/');

	const finalPath = s.ltrim(s.trim(path), '/');

	const url = s.rtrim(`${ pathPrefix }/${ finalPath }`, '/') + query;

	if (cloud) {
		const cloudParams = cloud_params || {};
		return getCloudUrl(url, siteUrl, cloudRoute, cloudParams);
	}

	if (cdn && cdnPrefix !== '') {
		return cdnPrefix + url;
	}

	if (full) {
		return s.rtrim(siteUrl, pathPrefix) + url;
	}

	return url;
};

export const getURL = (path, { cdn = true, full = false, cloud = false, cloud_route = '', cloud_params = {} } = {}) => _getURL(path, {
	cdn,
	full,
	cloud,
	cloud_route,
	cloud_params,
	_cdn_prefix: settings.get('CDN_PREFIX'),
	_root_url_path_prefix: __meteor_runtime_config__.ROOT_URL_PATH_PREFIX,
	_site_url: settings.get('Site_Url'),
});
