import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Meteor } from 'meteor/meteor';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type { IMessage } from '@rocket.chat/core-typings';

import { MessageTypes } from '../lib/MessageTypes';
import { settings } from '../../settings/server';
import { trim } from '../../../lib/utils/stringUtils';

export const Message = {
	parse(msg: IMessage, language: string) {
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
				if (!language) {
					language = Meteor._localStorage.getItem('userLanguage') || 'en';
				}
				const data = (typeof messageType.data === 'function' && messageType.data(msg)) || {};
				return TAPi18n.__(messageType.message, data, language);
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
