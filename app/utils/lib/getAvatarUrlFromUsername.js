import { Session } from 'meteor/session';
import { settings } from '../../settings';

export const getAvatarUrlFromUsername = function(username) {
	const externalSource = (settings.get('Accounts_AvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	if (externalSource !== '') {
		return externalSource.replace('{username}', username);
	}
	const key = `avatar_random_${ username }`;
	let _dc = Session.get(key);
	if (!_dc) {
		const now = Date.now();
		Session.set(key, now);
		_dc = now;
	}
	if (username == null) {
		return;
	}
	const cdnPrefix = (settings.get('CDN_PREFIX') || '').trim().replace(/\/$/, '');
	const pathPrefix = (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '').trim().replace(/\/$/, '');
	let path = pathPrefix;
	if (cdnPrefix) {
		path = cdnPrefix + pathPrefix;
	}
	return `${ path }/avatar/${ encodeURIComponent(username) }?_dc=${ _dc }`;
};
