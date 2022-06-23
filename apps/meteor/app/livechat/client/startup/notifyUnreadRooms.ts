import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../settings/client';
import { Subscriptions } from '../../../models/client';
import { KonchatNotification } from '../../../ui';

let audio: HTMLAudioElement | undefined;

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!settings.get('Livechat_continuous_sound_notification_new_livechat_room')) {
			audio?.pause();
			return;
		}

		const subs = Subscriptions.find({ t: 'l', ls: { $exists: 0 }, open: true }).count();
		if (subs === 0) {
			audio?.pause();
			return;
		}

		audio = KonchatNotification.newRoomSound(true);
	});
});
