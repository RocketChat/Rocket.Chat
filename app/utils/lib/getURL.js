import s from 'underscore.string';

import { isURL } from './isURL';
import { settings } from '../../settings';

function getCloudUrl(path, _site_url, cloudRoute) {
	const siteUrl = s.rtrim(_site_url, '/');

	// Remove the protocol
	const host = siteUrl.replace(/https?\:\/\//i, '');
	path = s.ltrim(path, '/');
	const url = `https://go.rocket.chat/${ cloudRoute }?host=${ encodeURIComponent(host) }&path=${ encodeURIComponent(path) }`;

	if (siteUrl.includes('http://')) {
		return `${ url }&secure=no`;
	}

	return url;
}

export const _getURL = (path, { cdn, full, cloud, cloud_route, _cdn_prefix, _root_url_path_prefix, _site_url }) => {
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

	if (cdn && cdnPrefix !== '') {
		return cdnPrefix + url;
	}

	if (full) {
		return siteUrl + url;
	}

	if (cloud) {
		return getCloudUrl(url, siteUrl, cloudRoute);
	}

	return url;
};

export const getURL = (path, { cdn = true, full = false, cloud = false, cloud_route = '' } = {}) => _getURL(path, {
	cdn,
	full,
	cloud,
	cloud_route,
	_cdn_prefix: settings.get('CDN_PREFIX'),
	_root_url_path_prefix: __meteor_runtime_config__.ROOT_URL_PATH_PREFIX,
	_site_url: settings.get('Site_Url'),
});
