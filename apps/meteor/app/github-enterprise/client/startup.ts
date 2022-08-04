import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings/client';
import { config, GitHubEnterprise } from '../lib/common';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (settings.get('API_GitHub_Enterprise_URL')) {
			config.serverURL = settings.get('API_GitHub_Enterprise_URL');
			GitHubEnterprise.configure(config);
		}
	});
});
