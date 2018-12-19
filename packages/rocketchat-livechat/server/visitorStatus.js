import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { UserPresenceEvents } from 'meteor/konecty:user-presence';

Meteor.startup(() => {
	UserPresenceEvents.on('setStatus', (session, status, metadata) => {
		if (metadata && metadata.visitor) {
			RocketChat.models.LivechatInquiry.updateVisitorStatus(metadata.visitor, status);
			RocketChat.models.Rooms.updateVisitorStatus(metadata.visitor, status);
		}
	});
});
