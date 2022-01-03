import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { actionLinks } from '../../action-links/client';
import { Rooms, Subscriptions } from '../../models';
import { dispatchToastMessage } from '../../../client/lib/toast';

actionLinks.register('joinJitsiCall', function joinJitsiCall(message, params, instance) {
	if (Session.get('openedRoom')) {
		const rid = Session.get('openedRoom');
		const username = Meteor.user()?.username;
		const userId = Meteor.userId();
		const sub = Subscriptions.findOne({ rid, 'u._id': userId });
		const openVideoCall = (rid) => {
			const room = Rooms.findOne({ _id: rid });
			const currentTime = new Date().getTime();
			const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

			if (room && room?.muted?.includes(username)) {
				dispatchToastMessage({ type: 'error', message: TAPi18n.__('You_have_been_muted', '') });
			} else if (jitsiTimeout > currentTime) {
				instance.tabBar.open('video');
			} else {
				dispatchToastMessage({ type: 'info', message: TAPi18n.__('Call Already Ended', '') });
			}
		};

		if (!sub) {
			Meteor.call('joinRoom', rid, (err, result) => {
				if (err) {
					throw err;
				}
				if (result === true) {
					setTimeout(() => openVideoCall(rid), 2000);
				}
			});
		} else {
			openVideoCall(rid);
		}
	}
});
