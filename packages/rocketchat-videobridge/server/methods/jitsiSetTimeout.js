
Meteor.methods({
	'jitsi:updateTimeout': (rid) => {
		console.log('jitsi:updateTimeout called!')
		let room = RocketChat.models.Rooms.findOne({_id: rid});
		let currentTime = new Date().getTime();

		let jitsiTimeout = new Date(room.jitsiTimeout || currentTime).getTime();

		let diff = jitsiTimeout - currentTime;

		console.log('Timeout: '+jitsiTimeout +' currentTime: ' + currentTime);
		console.log('diff between currentTime and Timeout: '+diff);

		if (jitsiTimeout <= currentTime) {
			console.log('call has not been started yet...');
			RocketChat.models.Rooms.setJitsiTimeout(rid, new Date(currentTime + 30*1000));
		} else if ((jitsiTimeout - currentTime) < 10) {
			console.log('updating timestamp');
			RocketChat.models.Rooms.setJitsiTimeout(rid, new Date(currentTime + 20*1000));
		}
	}
});
