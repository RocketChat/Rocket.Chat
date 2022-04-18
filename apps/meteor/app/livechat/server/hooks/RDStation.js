import { HTTP } from 'meteor/http';

import { settings } from '../../../settings';
import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';
import { SystemLogger } from '../../../../server/lib/logger/system';

function sendToRDStation(room) {
	if (!settings.get('Livechat_RDStation_Token')) {
		return room;
	}

	const livechatData = Livechat.getLivechatRoomGuestInfo(room);

	if (!livechatData.visitor.email) {
		return room;
	}

	const email = Array.isArray(livechatData.visitor.email) ? livechatData.visitor.email[0].address : livechatData.visitor.email;

	const options = {
		headers: {
			'Content-Type': 'application/json',
		},
		data: {
			token_rdstation: settings.get('Livechat_RDStation_Token'),
			identificador: 'rocketchat-livechat',
			client_id: livechatData.visitor._id,
			email,
		},
	};

	options.data.nome = livechatData.visitor.name || livechatData.visitor.username;

	if (livechatData.visitor.phone) {
		options.data.telefone = livechatData.visitor.phone;
	}

	if (livechatData.tags) {
		options.data.tags = livechatData.tags;
	}

	Object.keys(livechatData.customFields || {}).forEach((field) => {
		options.data[field] = livechatData.customFields[field];
	});

	Object.keys(livechatData.visitor.customFields || {}).forEach((field) => {
		options.data[field] = livechatData.visitor.customFields[field];
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
