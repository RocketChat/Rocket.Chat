import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Random } from 'meteor/random';

import { Rooms, Messages, Users } from '../../../models/server';
import { callbacks } from '../../../callbacks/server';
import { metrics } from '../../../metrics/server';
import * as CONSTANTS from '../../constants';
import { canSendMessage } from '../../../authorization/server';
import { SystemLogger } from '../../../logger/server';
import { Notifications } from '../../../notifications/server';

Meteor.methods({
	'jitsi:updateTimeout': (rid) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jitsi:updateTimeout' });
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

			if (!jitsiTimeout || currentTime > jitsiTimeout - CONSTANTS.TIMEOUT / 2) {
				Rooms.setJitsiTimeout(rid, new Date(currentTime + CONSTANTS.TIMEOUT));
			}

			if (!jitsiTimeout || currentTime > jitsiTimeout) {
				metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736

				const message = Messages.createWithTypeRoomIdMessageAndUser('jitsi_call_started', rid, '', Meteor.user(), {
					actionLinks: [
						{ icon: 'icon-videocam', label: TAPi18n.__('Click_to_join'), method_id: 'joinJitsiCall', params: '' },
					],
				});
				message.msg = TAPi18n.__('Started_a_video_call');
				message.mentions = [
					{
						_id: 'here',
						username: 'here',
					},
				];
				callbacks.run('afterSaveMessage', message, { ...room, jitsiTimeout: currentTime + CONSTANTS.TIMEOUT });
			}

			return jitsiTimeout;
		} catch (error) {
			if (error === 'error-not-allowed') {
				throw new Meteor.Error('error-not-allowed', 'not allowed', { method: 'jitsi:updateTimeout' });
			}

			SystemLogger.error('Error starting video call:', error);

			Notifications.notifyUser(uid, 'message', {
				_id: Random.id(),
				rid,
				ts: new Date(),
				msg: TAPi18n.__(error, {}, user.language),
			});
		}
	},
});
