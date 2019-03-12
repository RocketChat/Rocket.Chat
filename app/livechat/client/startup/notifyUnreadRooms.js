import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { settings } from 'meteor/rocketchat:settings';
import { getUserPreference } from 'meteor/rocketchat:utils';
import { Subscriptions, Users } from 'meteor/rocketchat:models';

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

		if (!settings.get('Livechat_continuous_sound_notification_new_livechat_room')) {
			stop(audio);
			return;
		}

		const subs = Subscriptions.find({ t: 'l', ls : { $exists: 0 }, open: true }).count();
		if (subs === 0) {
			stop(audio);
			return;
		}

		const user = Users.findOne(Meteor.userId(), {
			fields: {
				'settings.preferences.newRoomNotification': 1,
			},
		});

		const newRoomNotification = getUserPreference(user, 'newRoomNotification');

		[audio] = $(`#${ newRoomNotification }`);
		play(audio);

	});
});
