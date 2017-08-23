/* globals UserPresenceEvents */
Meteor.startup(() => {
	UserPresenceEvents.on('setStatus', (session, status) => {
		if (session && session.metadata && session.metadata.visitor) {
			RocketChat.models.Rooms.updateVisitorStatus(session.metadata.visitor, status);
		}
	});
});
