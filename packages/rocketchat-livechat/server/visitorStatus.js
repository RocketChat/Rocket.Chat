/* globals UserPresenceEvents */
Meteor.startup(() => {
	UserPresenceEvents.on('setStatus', (session, status, metadata) => {
		if (metadata && metadata.visitor) {
			RocketChat.models.LivechatInquiry.updateVisitorStatus(metadata.visitor, status);
			RocketChat.models.Rooms.updateVisitorStatus(metadata.visitor, status);
		}
	});
});
