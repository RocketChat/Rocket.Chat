import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { CustomSounds } from '../../../custom-sounds/client';
import { Subscriptions, Users } from '../../../models/client';
import { settings } from '../../../settings/client';
import { getUserPreference } from '../../../utils/client';

let audio = null;

Meteor.startup(() => {
	Tracker.autorun(async () => {
		if (!settings.get('Livechat_continuous_sound_notification_new_livechat_room')) {
			audio && audio.pause();
			return;
		}

		const subs = await Subscriptions.find({ t: 'l', ls: { $exists: false }, open: true }).count();
		if (subs === 0) {
			audio && audio.pause();
			return;
		}

		const user = await Users.findOne(
			{ _id: Meteor.userId() },
			{
				projection: {
					'settings.preferences.newRoomNotification': 1,
				},
			},
		);

		const newRoomNotification = getUserPreference(user, 'newRoomNotification');

		audio = CustomSounds.play(newRoomNotification, { loop: true });
	});
});
