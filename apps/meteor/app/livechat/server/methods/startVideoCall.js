import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';

import { Messages } from '../../../models';
import { settings } from '../../../settings';
import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'livechat:startVideoCall'(roomId) {
		methodDeprecationLogger.warn('livechat:startVideoCall will be deprecated in future versions of Rocket.Chat');
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'livechat:closeByVisitor',
			});
		}

		const guest = Meteor.user();

		const message = {
			_id: Random.id(),
			rid: roomId || Random.id(),
			msg: '',
			ts: new Date(),
		};

		const roomInfo = {
			jitsiTimeout: new Date(Date.now() + 3600 * 1000),
			source: {
				type: OmnichannelSourceType.API,
				alias: 'video-call',
			},
		};

		const room = await Livechat.getRoom(guest, message, roomInfo);
		message.rid = room._id;

		Messages.createWithTypeRoomIdMessageAndUser('livechat_video_call', room._id, '', guest, {
			actionLinks: [
				{ icon: 'icon-videocam', i18nLabel: 'Accept', method_id: 'createLivechatCall', params: '' },
				{ icon: 'icon-cancel', i18nLabel: 'Decline', method_id: 'denyLivechatCall', params: '' },
			],
		});

		let rname;
		if (settings.get('Jitsi_URL_Room_Hash')) {
			rname = settings.get('uniqueID') + roomId;
		} else {
			rname = encodeURIComponent(room.t === 'd' ? room.usernames.join(' x ') : room.name);
		}
		return {
			roomId: room._id,
			domain: settings.get('Jitsi_Domain'),
			jitsiRoom: settings.get('Jitsi_URL_Room_Prefix') + rname + settings.get('Jitsi_URL_Room_Suffix'),
		};
	},
});
