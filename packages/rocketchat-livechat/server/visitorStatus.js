import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { UserPresenceEvents } from 'meteor/konecty:user-presence';

Meteor.startup(() => {
	UserPresenceEvents.on('setStatus', (session, status, metadata) => {
		if (metadata && metadata.visitor) {
			RocketChat.Livechat.notifyGuestStatusChanged(metadata.visitor, status);
		}
	});
});
