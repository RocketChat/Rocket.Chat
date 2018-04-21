let audio = null;

const stop = audio => {
	if (!audio) {
		return;
	}
	audio.loop = false;
	return audio.pause && audio.pause();
};
const play = audio => {
	if (!audio) {
		return;
	}
	audio.loop = true;
	return audio.play && audio.play();
};

Meteor.startup(function() {
	Tracker.autorun(function() {


		const subs = RocketChat.models.Subscriptions.find({ t: 'l', ls : { $exists: 0 } }).count();

		const user = RocketChat.models.Users.findOne(Meteor.userId(), {
			fields: {
				'settings.preferences.newRoomNotification': 1
			}
		});

		const newRoomNotification = RocketChat.getUserPreference(user, 'newRoomNotification');

		stop(audio);

		if (!RocketChat.settings.get('Livechat_continuous_sound_notification_new_livechat_room')) {
			return;
		}

		[audio] = $(`#${ newRoomNotification }`);

		if (!audio || !audio.play || !audio.pause) {
			return;
		}

		if (subs === 0) {
			return;
		}

		play(audio);

	});
});
