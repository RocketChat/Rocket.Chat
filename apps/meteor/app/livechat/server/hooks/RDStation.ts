import { HTTP } from 'meteor/http';
import { IOmnichannelRoom, IRoom, ILivechatVisitor } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server/index';
import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';
import { SystemLogger } from '../../../../server/lib/logger/system';

type RoomGuestInfo = IOmnichannelRoom & {
	visitor: ILivechatVisitor & { email: ILivechatVisitor['visitorEmails']; customFields: ILivechatVisitor['livechatData'] };
	customFields: IOmnichannelRoom['livechatData'];
};

function sendToRDStation(room: IRoom): IRoom {
	if (!settings.get('Livechat_RDStation_Token')) {
		return room;
	}

	const livechatData = Livechat.getLivechatRoomGuestInfo(room) as unknown as RoomGuestInfo;

	if (!livechatData.visitor.email) {
		return room;
	}

	const email = Array.isArray(livechatData.visitor.email) ? livechatData.visitor.email[0].address : livechatData.visitor.email;

	const options = {
		headers: {
			'Content-Type': 'application/json',
		},
		data: {
			// eslint-disable-next-line @typescript-eslint/camelcase
			token_rdstation: settings.get('Livechat_RDStation_Token'),
			identificador: 'rocketchat-livechat',
			// eslint-disable-next-line @typescript-eslint/camelcase
			client_id: livechatData.visitor._id,
			email,
			name: livechatData.visitor.name || livechatData.visitor.username,
			phone: '',
			tags: undefined,
			...(livechatData.visitor.phone && { phone: livechatData.visitor.phone }),
			...(livechatData.tags && { tags: livechatData.tags }),
		},
	};

	Object.keys(livechatData.customFields || {}).forEach((field) => {
		options.data[field] = livechatData.customFields[field];
	});

	Object.keys(livechatData.visitor.customFields || {}).forEach((field) => {
		options.data[field] = livechatData.visitor?.customFields?.[field];
	});

	try {
		HTTP.call('POST', 'https://www.rdstation.com.br/api/1.3/conversions', options);
	} catch (e) {
		SystemLogger.error('Error sending lead to RD Station ->', e);
	}

	return room;
}

callbacks.add('livechat.closeRoom', sendToRDStation, callbacks.priority.MEDIUM, 'livechat-rd-station-close-room');

callbacks.add('livechat.saveInfo', sendToRDStation, callbacks.priority.MEDIUM, 'livechat-rd-station-save-info');
