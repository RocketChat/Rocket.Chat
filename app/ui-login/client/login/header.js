import { Template } from 'meteor/templating';
import { settings } from '/app/settings';

Template.loginHeader.helpers({
	logoUrl() {
		const asset = settings.get('Assets_logo');
		const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
		if (asset != null) {
			return `${ prefix }/${ asset.url || asset.defaultUrl }`;
		}
	},
});
