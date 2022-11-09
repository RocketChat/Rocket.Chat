import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { settings } from '../../../settings';

Template.loginLayout.helpers({
	backgroundUrl() {
		const asset = settings.get('Assets_background');
		const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
		if (asset && (asset.url || asset.defaultUrl)) {
			return `${prefix}/${asset.url || asset.defaultUrl}`;
		}
	},
	showForcedLogoutBanner() {
		return Session.get('force_logout');
	},
});
