import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { settings } from 'meteor/rocketchat:settings';
import { CachedChatRoom, CachedChatSubscription } from 'meteor/rocketchat:models';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') === true) {
			CachedChatRoom.init();
			CachedChatSubscription.ready.set(true);
		}
	});
});
