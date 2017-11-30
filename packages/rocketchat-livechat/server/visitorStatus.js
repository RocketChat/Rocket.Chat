/* globals UserPresenceEvents */
Meteor.startup(() => {
	UserPresenceEvents.on('setStatus', (session, status, metadata) => {
		if (metadata && metadata.visitor) {
			RocketChat.models.Rooms.updateVisitorStatus(metadata.visitor, status);
		}
	});
});
