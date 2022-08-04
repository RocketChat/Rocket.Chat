import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings/client';
import { config, Gitlab } from '../lib/common';

Meteor.startup(() => {
	Tracker.autorun(() => {
		let anyChange = false;
		if (settings.get('API_Gitlab_URL')) {
			config.serverURL = settings.get('API_Gitlab_URL').trim().replace(/\/*$/, '');
			anyChange = true;
		}

		if (settings.get('Accounts_OAuth_Gitlab_identity_path')) {
			config.identityPath = settings.get('Accounts_OAuth_Gitlab_identity_path').trim() || config.identityPath;
			anyChange = true;
		}

		if (settings.get('Accounts_OAuth_Gitlab_merge_users')) {
			config.mergeUsers = true;
			anyChange = true;
		}

		if (anyChange) {
			Gitlab.configure(config);
		}
	});
});
