Meteor.methods({
	'jitsi:disconnect': (rid) => {
		RocketChat.models.Rooms.removeJitsiConnected(rid, Meteor.userId());
	}
});
