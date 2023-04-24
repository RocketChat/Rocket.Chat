import { Translation } from '@rocket.chat/core-services';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { MessageTypes } from '../lib/MessageTypes';
import { settings } from '../../settings';
import { trim } from '../../../lib/utils/stringUtils';

export const Message = {
	async parse(msg, language) {
		const messageType = MessageTypes.getType(msg);
		if (messageType) {
			if (messageType.render) {
				return messageType.render(msg);
			}
			if (messageType.template) {
				// Render message
				return;
			}
			if (messageType.message) {
				const data = (typeof messageType.data === 'function' && messageType.data(msg)) || {};
				return Translation.translateText(messageType.message, language || 'en', data);
			}
		}
		if (msg.u && msg.u.username === settings.get('Chatops_Username')) {
			msg.html = msg.msg;
			return msg.html;
		}
		msg.html = msg.msg;
		if (trim(msg.html) !== '') {
			msg.html = escapeHTML(msg.html);
		}
		msg.html = msg.html.replace(/\n/gm, '<br/>');
		return msg.html;
	},
};
