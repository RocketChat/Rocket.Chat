import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { settings } from '/app/settings';
import { CachedChatRoom, CachedChatSubscription } from '/app/models';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') === true) {
			CachedChatRoom.init();
			CachedChatSubscription.ready.set(true);
		}
	});
});
