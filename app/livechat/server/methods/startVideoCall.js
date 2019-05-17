import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Messages } from '../../../models';
import { settings } from '../../../settings';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:startVideoCall'(roomId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:closeByVisitor' });
		}

		const guest = Meteor.user();

		const message = {
			_id: Random.id(),
			rid: roomId || Random.id(),
			msg: '',
			ts: new Date(),
		};

		const { room } = Livechat.getRoom(guest, message, { jitsiTimeout: new Date(Date.now() + 3600 * 1000) });
		message.rid = room._id;

		Messages.createWithTypeRoomIdMessageAndUser('livechat_video_call', room._id, '', guest, {
			actionLinks: [
				{ icon: 'icon-videocam', i18nLabel: 'Accept', method_id: 'createLivechatCall', params: '' },
				{ icon: 'icon-cancel', i18nLabel: 'Decline', method_id: 'denyLivechatCall', params: '' },
			],
		});

		return {
			roomId: room._id,
			domain: settings.get('Jitsi_Domain'),
			jitsiRoom: settings.get('Jitsi_URL_Room_Prefix') + settings.get('uniqueID') + roomId,
		};
	},
});
