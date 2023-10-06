import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { CustomSounds } from '../../../app/custom-sounds/client/lib/CustomSounds';
import { Users } from '../../../app/models/client';
import { getUserPreference } from '../../../app/utils/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const uid = Meteor.userId();

		if (!uid) {
			return;
		}

		const user = Users.findOne(uid, {
			fields: {
				'settings.preferences.newRoomNotification': 1,
				'settings.preferences.notificationsSoundVolume': 1,
			},
		});
		const newRoomNotification = getUserPreference<string>(user, 'newRoomNotification');
		const audioVolume = getUserPreference(user, 'notificationsSoundVolume', 100);

		if (!newRoomNotification) {
			return;
		}

		if ((Session.get('newRoomSound') || []).length > 0) {
			setTimeout(() => {
				if (newRoomNotification !== 'none') {
					CustomSounds.play(newRoomNotification, {
						volume: Number((audioVolume / 100).toPrecision(2)),
					});
				}
			}, 0);
		} else {
			CustomSounds.pause(newRoomNotification);
		}
	});
});
