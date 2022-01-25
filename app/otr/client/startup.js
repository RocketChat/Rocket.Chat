import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

export const testOtrStreamer = new Meteor.Streamer('test-otr');
const testRoomStreamer = new Meteor.Streamer('notify-room');

Meteor.startup(() => {
	Tracker.autorun(async (c) => {
		if (!Meteor.userId()) {
			return;
		}
		console.log("Running client Streamer");
		try {
			testOtrStreamer.on('otr-message', (...args) => {
				console.log('jhghjbjb', args);
			});

			testRoomStreamer.on('otr-message', (...args) => {
				console.log('jhghjbjb', args);
			});

		} catch (error) {
			console.log(error);
		}
	});
});
