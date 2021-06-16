import { Template } from 'meteor/templating';

import { settings } from '../../../settings';
import { isAbsoluteLocation } from '../../../lib/client';

Template.loginHeader.helpers({
	logoUrl() {
		const asset = settings.get('Assets_logo');
		const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
		if (asset != null) {
			const url = `${ asset.url || asset.defaultUrl }`;
			return `${ isAbsoluteLocation(url) ? '' : `${ prefix }/` }${ url }`;
		}
	},
});
