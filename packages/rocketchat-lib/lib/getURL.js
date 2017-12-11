import s from 'underscore.string';

RocketChat.getURL = (path, { cdn = true, full = false } = {}) => {
	const cdnPrefix = s.rtrim(s.trim(RocketChat.settings.get('CDN_PREFIX') || ''), '/');
	const pathPrefix = s.rtrim(s.trim(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''), '/');

	let basePath;

	const finalPath = s.ltrim(s.trim(path), '/');

	if (cdn && cdnPrefix !== '') {
		basePath = cdnPrefix + pathPrefix;
	} else if (full || Meteor.isCordova) {
		return Meteor.absoluteUrl(finalPath);
	} else {
		basePath = pathPrefix;
	}

	return `${ basePath }/${ finalPath }`;
};
