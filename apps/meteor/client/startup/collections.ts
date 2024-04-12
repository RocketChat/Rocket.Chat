import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { CachedChatRoom, CachedChatSubscription } from '../../app/models/client';
import { settings } from '../../app/settings/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') === true) {
			CachedChatRoom.init();
			CachedChatSubscription.ready.set(true);
		}
	});
});
