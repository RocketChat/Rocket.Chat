import { Template } from 'meteor/templating';

import { settings } from '../../../settings';
import { isAbsoluteLocation } from '../../../lib/client';

Template.loginLayout.onRendered(function() {
	$('#initial-page-loading').remove();
});

Template.loginLayout.helpers({
	backgroundUrl() {
		const asset = settings.get('Assets_background');
		const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
		if (asset && (asset.url || asset.defaultUrl)) {
			const url = `${ asset.url || asset.defaultUrl }`;
			return `${ isAbsoluteLocation(url) ? '' : prefix }/${ url }`;
		}
	},
});
