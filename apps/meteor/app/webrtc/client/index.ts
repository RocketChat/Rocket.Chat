import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../notifications/client';
import { WEB_RTC_EVENTS } from '../lib/constants';

import './adapter';
import './actionLink';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (Meteor.userId()) {
			Notifications.onUser(WEB_RTC_EVENTS.WEB_RTC, async (type, data) => {
				if (data.room == null) {
					return;
				}

				const { WebRTC } = await import('./WebRTCClass');
				const webrtc = WebRTC.getInstanceByRoomId(data.room);
				webrtc.onUserStream(type, data);
			});
		}
	});
});
