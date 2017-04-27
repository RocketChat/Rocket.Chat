Template.loginHeader.helpers({
	logoUrl() {
		const asset = RocketChat.settings.get('Assets_logo');
		const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
		if (asset != null) {
			return `${ prefix }/${ asset.url || asset.defaultUrl }`;
		}
	}
});
