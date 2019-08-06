import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings';
import { hasAllPermission } from '../../authorization';


Meteor.startup(() => {
	Tracker.autorun((c) => {
		if (!settings.get('Livechat_enabled') || !hasAllPermission('view-livechat-manager')) {
			return;
		}
		c.stop();
		import('../lib/messageTypes');
		import('../lib/LivechatExternalMessage');
		import('./roomType');
		import('./route');
		import('./ui');
		import('./startup/notifyUnreadRooms');
		import('./views');
		import('./stylesheets/livechat.less');
	});
});
