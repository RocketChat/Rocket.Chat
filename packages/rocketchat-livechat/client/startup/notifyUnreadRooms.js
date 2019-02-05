import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { RocketChat } from 'meteor/rocketchat:lib';

let audio = null;

const stop = (audio) => {
	if (!audio) {
		return;
	}
	audio.loop = false;
	return audio.pause && audio.pause();
};
const play = (audio) => {
	if (!audio) {
		return;
	}
	audio.loop = true;
	return audio.play && audio.play();
};

Meteor.startup(function() {
	Tracker.autorun(function() {

		if (!RocketChat.settings.get('Livechat_continuous_sound_notification_new_livechat_room')) {
			stop(audio);
			return;
		}

		const subs = RocketChat.models.Subscriptions.find({ t: 'l', ls : { $exists: 0 }, open: true }).count();
		if (subs === 0) {
			stop(audio);
			return;
		}

		const user = RocketChat.models.Users.findOne(Meteor.userId(), {
			fields: {
				'settings.preferences.newRoomNotification': 1,
			},
		});

		const newRoomNotification = RocketChat.getUserPreference(user, 'newRoomNotification');

		[audio] = $(`#${ newRoomNotification }`);
		play(audio);

	});
});
