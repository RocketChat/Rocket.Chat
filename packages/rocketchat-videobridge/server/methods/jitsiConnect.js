Meteor.methods({
	'jitsi:connect': (rid) => {
		RocketChat.models.Rooms.addJitsiConnected(rid, Meteor.userId());
	}
});
