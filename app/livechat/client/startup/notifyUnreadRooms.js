import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../settings';
import { getUserPreference } from '../../../utils';
import { Subscriptions, Users } from '../../../models';
import { CustomSounds } from '../../../custom-sounds/client';

let audio = null;

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!settings.get('Livechat_continuous_sound_notification_new_livechat_room')) {
			audio && audio.pause();
			return;
		}

		const subs = Subscriptions.find({ t: 'l', ls: { $exists: 0 }, open: true }).count();
		if (subs === 0) {
			audio && audio.pause();
			return;
		}

		const user = Users.findOne(Meteor.userId(), {
			fields: {
				'settings.preferences.newRoomNotification': 1,
			},
		});

		const newRoomNotification = getUserPreference(user, 'newRoomNotification');

		audio = CustomSounds.play(newRoomNotification, { loop: true });
	});
});
