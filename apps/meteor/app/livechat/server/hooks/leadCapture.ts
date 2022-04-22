import { IMessage, IRoom, isEditedMessage, isOmnichannelRoom, IOmnichannelMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server/index';
import { LivechatVisitors } from '../../../models/server/index';

function validateMessage(message: IMessage, room: IRoom): boolean | IMessage {
	// do nothing if room is not omnichannel room
	if (!isOmnichannelRoom(room)) {
		return message;
	}

	// skips this callback if the message was edited
	if (isEditedMessage(message)) {
		return false;
	}

	// message valid only if it is a livechat room
	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return false;
	}

	// if the message hasn't a token, it was NOT sent from the visitor, so ignore it
	if (!(message as IOmnichannelMessage).token) {
		return false;
	}

	// if the message has a type means it is a special message (like the closing comment), so skips
	if (message.t) {
		return false;
	}

	return true;
}

callbacks.add(
	'afterSaveMessage',
	function (message: IMessage, room: IRoom): IMessage {
		// do nothing if room is not omnichannel room
		if (!isOmnichannelRoom(room)) {
			return message;
		}

		if (!validateMessage(message, room)) {
			return message;
		}

		const phoneRegexp = new RegExp(settings.get<string>('Livechat_lead_phone_regex'), 'g');
		const msgPhones = message.msg.match(phoneRegexp);

		const emailRegexp = new RegExp(settings.get<string>('Livechat_lead_email_regex'), 'gi');
		const msgEmails = message.msg.match(emailRegexp);

		if (msgEmails || msgPhones) {
			LivechatVisitors.saveGuestEmailPhoneById(room.v._id, msgEmails, msgPhones);

			callbacks.run('livechat.leadCapture', room);
		}

		return message;
	},
	callbacks.priority.LOW,
	'leadCapture',
);
