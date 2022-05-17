import { Meteor } from 'meteor/meteor';

// import { Livechat } from './lib/Livechat';

Meteor.startup(() => {
	// TODO presence for visitors?
	// UserPresenceEvents.on('setStatus', (session, status, metadata) => {
	// 	if (metadata && metadata.visitor) {
	// 		Livechat.notifyGuestStatusChanged(metadata.visitor, status);
	// 	}
	// });
});
