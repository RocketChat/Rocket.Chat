import { Meteor } from 'meteor/meteor';
import { UserPresenceEvents } from 'meteor/konecty:user-presence';

import { Livechat } from './lib/Livechat';

Meteor.startup(() => {
	UserPresenceEvents.on('setStatus', (session, status, metadata) => {
		if (metadata && metadata.visitor) {
			Livechat.notifyGuestStatusChanged(metadata.visitor, status);
		}
	});
});
