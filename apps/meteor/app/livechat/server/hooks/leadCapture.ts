import type { IMessage, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { isTruthy } from '../../../../lib/isTruthy';
import { callbacks } from '../../../../server/lib/callbacks';
import { settings } from '../../../settings/server';

function validateMessage(message: IMessage, room: IOmnichannelRoom) {
	// skips this callback if the message was edited
	if (isEditedMessage(message)) {
		return false;
	}

	// message valid only if it is a livechat room
	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return false;
	}

	// if the message hasn't a token, it was NOT sent from the visitor, so ignore it
	if (!message.token) {
		return false;
	}

	// if the message has a type means it is a special message (like the closing comment), so skips
	if (message.t) {
		return false;
	}

	return true;
}

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message, { room }) => {
		if (!validateMessage(message, room)) {
			return message;
		}

		const phoneRegexSetting = settings.get<string>('Livechat_lead_phone_regex');
		const emailRegexSetting = settings.get<string>('Livechat_lead_email_regex');

		const safeMatch = (pattern: string, flags: string, text: string): string[] => {
			if (!pattern) {
				return [];
			}
			try {
				const re = new RegExp(pattern, flags);
				return text.match(re)?.filter(isTruthy) ?? [];
			} catch {
				return [];
			}
		};

		const uniq = (arr: string[]) => [...new Set(arr.filter(isTruthy))];

		const matchedPhones = uniq(safeMatch(phoneRegexSetting, 'g', message.msg));
		const matchedEmails = uniq(safeMatch(emailRegexSetting, 'gi', message.msg));

		if (matchedEmails.length || matchedPhones.length) {
			await LivechatVisitors.saveGuestEmailPhoneById(room.v._id, matchedEmails, matchedPhones);
			await callbacks.run('livechat.leadCapture', room);
		}

		return message;
	},
	callbacks.priority.LOW,
	'leadCapture',
);
