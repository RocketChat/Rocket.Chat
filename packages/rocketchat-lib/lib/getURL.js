RocketChat.getURL = (path, { cdn = true, full = false } = {}) => {
	const cdnPrefix = _.rtrim(_.trim(RocketChat.settings.get('CDN_PREFIX') || ''), '/');
	const pathPrefix = _.rtrim(_.trim(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''), '/');

	let basePath;

	const finalPath = _.ltrim(_.trim(path), '/');

	if (cdn && cdnPrefix !== '') {
		basePath = cdnPrefix + pathPrefix;
	} else if (full || Meteor.isCordova) {
		return Meteor.absoluteUrl(finalPath);
	} else {
		basePath = pathPrefix;
	}

	return `${ basePath }/${ finalPath }`;
};
