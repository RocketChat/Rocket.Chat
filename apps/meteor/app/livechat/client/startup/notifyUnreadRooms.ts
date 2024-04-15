import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { CustomSounds } from '../../../custom-sounds/client';
import { Subscriptions, Users } from '../../../models/client';
import { settings } from '../../../settings/client';
import { getUserPreference } from '../../../utils/client';

let newRoomNotification: string | undefined = undefined;

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const _id = Meteor.userId();

		if (!_id) {
			return;
		}

		if (newRoomNotification) {
			if (!settings.get('Livechat_continuous_sound_notification_new_livechat_room')) {
				CustomSounds.pause(newRoomNotification);
				return;
			}

			const subs = await Subscriptions.find({ t: 'l', ls: { $exists: false }, open: true }).count();
			if (subs === 0) {
				CustomSounds.pause(newRoomNotification);
				return;
			}
		}

		const user = await Users.findOne(
			{ _id },
			{
				projection: {
					'settings.preferences.newRoomNotification': 1,
					'settings.preferences.notificationsSoundVolume': 1,
				},
			},
		);

		newRoomNotification = getUserPreference<string>(user, 'newRoomNotification');
		const audioVolume = getUserPreference(user, 'notificationsSoundVolume', 100);

		if (newRoomNotification) {
			await CustomSounds.play(newRoomNotification, {
				volume: Number((audioVolume / 100).toPrecision(2)),
				loop: true,
			});
		}
	});
});
