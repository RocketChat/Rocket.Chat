import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Rooms, Messages, Users } from '../../../models/server';
import { callbacks } from '../../../../lib/callbacks';
import { metrics } from '../../../metrics/server';
import * as CONSTANTS from '../../constants';
import { canSendMessage } from '../../../authorization/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings';

// TODO: Access Token missing. This is just a partial solution, it doesn't handle access token generation logic as present in this file - client/views/room/contextualBar/Call/Jitsi/CallJitsWithData.js
const resolveJitsiCallUrl = (room) => {
	const rname = settings.get('Jitsi_URL_Room_Hash')
		? settings.get('uniqueID') + room._id
		: encodeURIComponent(room.t === 'd' ? room.usernames.join(' x ') : room.name);
	return `${settings.get('Jitsi_SSL') ? 'https://' : 'http://'}${settings.get('Jitsi_Domain')}/${settings.get(
		'Jitsi_URL_Room_Prefix',
	)}${rname}${settings.get('Jitsi_URL_Room_Suffix')}`;
};

Meteor.methods({
	'jitsi:updateTimeout': (rid, joiningNow = true) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'jitsi:updateTimeout',
			});
		}

		const uid = Meteor.userId();

		const user = Users.findOneById(uid, {
			fields: {
				username: 1,
				type: 1,
			},
		});

		try {
			const room = canSendMessage(rid, { uid, username: user.username, type: user.type });

			const currentTime = new Date().getTime();

			const jitsiTimeout = room.jitsiTimeout && new Date(room.jitsiTimeout).getTime();

			const nextTimeOut = new Date(currentTime + CONSTANTS.TIMEOUT);

			if (!jitsiTimeout || currentTime > jitsiTimeout - CONSTANTS.TIMEOUT / 2) {
				Rooms.setJitsiTimeout(rid, nextTimeOut);
			}

			if (joiningNow && (!jitsiTimeout || currentTime > jitsiTimeout)) {
				metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736

				const message = Messages.createWithTypeRoomIdMessageAndUser('jitsi_call_started', rid, '', Meteor.user(), {
					actionLinks: [
						{
							icon: 'icon-videocam',
							label: TAPi18n.__('Click_to_join'),
							i18nLabel: 'Click_to_join',
							method_id: 'joinJitsiCall',
							params: '',
						},
					],
					customFields: {
						...(room.customFields && { ...room.customFields }),
						...(room.t === 'l' && { jitsiCallUrl: resolveJitsiCallUrl(room) }), // Note: this is just a temporary solution for the jitsi calls to work in Livechat. In future we wish to create specific events for specific to livechat calls (eg: start, accept, decline, end, etc) and this url info will be passed via there
					},
				});
				message.msg = TAPi18n.__('Started_a_video_call');
				callbacks.run('afterSaveMessage', message, {
					...room,
					jitsiTimeout: currentTime + CONSTANTS.TIMEOUT,
				});
			}

			return jitsiTimeout || nextTimeOut;
		} catch (err) {
			SystemLogger.error({ msg: 'Error starting video call:', err });

			throw new Meteor.Error('error-starting-video-call', err.message, {
				method: 'jitsi:updateTimeout',
			});
		}
	},
});
