import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings/client';

Meteor.startup(() => {
	Tracker.autorun((c) => {
		if (!settings.get('Webdav_Integration_Enabled')) {
			return;
		}
		c.stop();
		import('./startup/sync');
		import('./actionButton');
	});
});
