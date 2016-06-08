Meteor.methods({
	'jitsi:isActive': (rid) => {
		console.log('Checking if active', rid);
		let room = RocketChat.models.Rooms.findOne({_id: rid});
		let currentTime = new Date().getTime();

		if (room.jitsiTimeout !== undefined) {
			if (currentTime > new Date(room.jitsiTimeout).getTime()) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
});
