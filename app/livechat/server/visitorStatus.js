import { Meteor } from 'meteor/meteor';

import { Livechat } from './lib/Livechat';
import { UserPresenceEvents } from '../../presence/server/monitor';

Meteor.startup(() => {
	UserPresenceEvents.on('setStatus', (session, status, metadata) => {
		if (metadata && metadata.visitor) {
			Livechat.notifyGuestStatusChanged(metadata.visitor, status);
		}
	});
});
