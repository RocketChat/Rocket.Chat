
Meteor.methods({
	'jitsi:updateTimeout': (rid) => {
		let room = RocketChat.models.Rooms.findOne({_id: rid});
		let currentTime = new Date().getTime();

		let jitsiTimeout = new Date(room.jitsiTimeout || currentTime).getTime();

		if (jitsiTimeout <= currentTime) {
			RocketChat.models.Rooms.setJitsiTimeout(rid, new Date(currentTime + 30*1000));
		} else if ((jitsiTimeout - currentTime) < 10) {
			RocketChat.models.Rooms.setJitsiTimeout(rid, new Date(currentTime + 20*1000));
		}
	}
});
