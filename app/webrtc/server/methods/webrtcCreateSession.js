import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Messages, Users } from '../../../models/server';
import { callbacks } from '../../../callbacks/server';
import { canSendMessage } from '../../../authorization/server';
import { SystemLogger } from '../../../logger/server';

Meteor.methods({
	'webrtc:createSession': (rid) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'webrtc:createSession' });
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

			const message = Messages.createWithTypeRoomIdMessageAndUser('webRTC_call_started', rid, '', Meteor.user(), {
				actionLinks: [
					{ icon: 'icon-videocam', label: TAPi18n.__('Click_to_join'), i18nLabel: 'Click_to_join', method_id: 'joinWebRTCCall', params: '' },
				],
				callStatus: 'ringing',
			});
			message.msg = TAPi18n.__('Started_a_video_call');
			callbacks.run('afterSaveMessage', message, { ...room });

			return message._id;
		} catch (error) {
			SystemLogger.error('Error starting webRTC video call:', error);

			throw new Meteor.Error('error-starting-webRTC-video-call', error.message);
		}
	},
});
