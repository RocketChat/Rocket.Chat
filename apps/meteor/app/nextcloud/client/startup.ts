import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

import { settings } from '../../settings/client';
import { config, Nextcloud } from '../lib/common';

const fillServerURL = _.debounce(
	Meteor.bindEnvironment(() => {
		const nextcloudURL = settings.get('Accounts_OAuth_Nextcloud_URL');
		if (!nextcloudURL) {
			if (nextcloudURL === undefined) {
				fillServerURL();
				return;
			}

			return;
		}

		config.serverURL = nextcloudURL.trim().replace(/\/*$/, '');
		Nextcloud.configure(config);
	}),
	100,
);

Meteor.startup(() => {
	Tracker.autorun(() => {
		fillServerURL();
	});
});
