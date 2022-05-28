import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { actionLinks } from '../../action-links/client';
import { Rooms } from '../../models';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { APIClient } from '../../utils/client';

actionLinks.register('joinJitsiCall', function (message, params, instance) {
	const rid = Session.get('openedRoom');
	if (!rid) {
		return;
	}

	const room = Rooms.findOne({ _id: rid });
	const username = Meteor.user()?.username;

	if (!room) {
		dispatchToastMessage({ type: 'info', message: TAPi18n.__('Call Already Ended', '') });
		return;
	}

	if (room?.muted?.includes(username)) {
		dispatchToastMessage({ type: 'error', message: TAPi18n.__('You_have_been_muted', '') });
		return;
	}

	const clickTime = new Date();
	const jitsiTimeout = new Date(room.jitsiTimeout);

	APIClient.v1.post('statistics.telemetry', {
		params: [{ eventName: 'updateCounter', timestamp: Date.now(), settingsId: 'Jitsi_Click_To_Join_Count' }],
	});

	if (jitsiTimeout > clickTime) {
		if (instance instanceof Function) {
			instance('video');
		} else {
			instance.tabBar.open('video');
		}

		return;
	}

	// Get updated room info from the server to check if the call is still happening
	Meteor.call('getRoomById', rid, (err, result) => {
		if (err) {
			throw err;
		}

		// If the openedRoom has changed, abort
		if (rid !== Session.get('openedRoom')) {
			return;
		}

		if (result?.jitsiTimeout && result.jitsiTimeout instanceof Date && result.jitsiTimeout > clickTime) {
			if (instance instanceof Function) {
				instance('video');
			} else {
				instance.tabBar.open('video');
			}
			return;
		}

		dispatchToastMessage({ type: 'info', message: TAPi18n.__('Call Already Ended', '') });
	});
});
