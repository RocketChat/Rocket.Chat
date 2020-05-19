/* eslint-disable @typescript-eslint/camelcase */
import s from 'underscore.string/index';

import { isURL } from './isURL';
import { ISettingsBase } from '../../settings/lib/settings';

interface IURLOptions {
	cdn: boolean;
	full: boolean;
	cloud: boolean;
	cloud_route: string;
	cloud_params: any;
}

interface IInternalURL extends IURLOptions {
	_cdn_prefix: string;
	_root_url_path_prefix: string;
	_site_url: string;
}

interface IAvatarURL {
	username?: string;
	roomId?: string;
	cache?: string;
}

export interface ICommonUtils {
	getURL(path: string, options?: IURLOptions): string;
	getAvatarURL(params: IAvatarURL): string;
}

export class CommonUtils implements ICommonUtils {
	private settings: ISettingsBase;

	constructor(settings: ISettingsBase) {
		this.settings = settings;
	}

	private getCloudUrl(path: string, _site_url: string, cloudRoute: string, cloudParams: any = {}): string {
		const cloudBaseUrl = String(this.settings.get('DeepLink_Url') || '').replace(/\/+$/, '');

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

		const params = Object.entries(cloudParams).map(([key, value]) => `${ key }=${ encodeURIComponent(value as any) }`).join('&');

		return `${ cloudBaseUrl }/${ cloudRoute }?${ params }`;
	}

	private mountUrl(path: string, { cdn, full, cloud, cloud_route, cloud_params, _cdn_prefix, _root_url_path_prefix, _site_url }: IInternalURL): string {
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
			return this.getCloudUrl(url, siteUrl, cloudRoute, cloudParams);
		}

		if (cdn && cdnPrefix !== '') {
			return cdnPrefix + url;
		}

		if (full) {
			return siteUrl + url;
		}

		return url;
	}

	getURL(path: string, options?: IURLOptions): string {
		const { cdn = true, full = false, cloud = false, cloud_route = '', cloud_params = {} } = options || {} as IURLOptions;
		return this.mountUrl(path, {
			_cdn_prefix: this.settings.get('CDN_PREFIX') as string,
			// @ts-ignore
			_root_url_path_prefix: __meteor_runtime_config__.ROOT_URL_PATH_PREFIX,
			_site_url: this.settings.get('Site_Url') as string,
			cdn,
			full,
			cloud,
			cloud_route,
			cloud_params,
		});
	}

	getAvatarURL({ username, roomId, cache }: IAvatarURL): string {
		if (username) {
			return this.getURL(`/avatar/${ encodeURIComponent(username) }${ cache ? `?_dc=${ cache }` : '' }`);
		}
		if (roomId) {
			return this.getURL(`/avatar/room/${ encodeURIComponent(roomId) }${ cache ? `?_dc=${ cache }` : '' }`);
		}
		return '';
	}
}
