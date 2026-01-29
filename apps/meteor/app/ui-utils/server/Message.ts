import type { IMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { Accounts } from 'meteor/accounts-base';

import { trim } from '../../../lib/utils/stringUtils';
import { i18n } from '../../../server/lib/i18n';
import { settings } from '../../settings/server';

export const Message = {
	parse(msg: IMessage, language: string) {
		const messageType = MessageTypes.getType(msg);
		if (messageType) {
			return messageType.text(i18n.getFixedT(language || Accounts.storageLocation.getItem('userLanguage') || 'en'), msg);
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
