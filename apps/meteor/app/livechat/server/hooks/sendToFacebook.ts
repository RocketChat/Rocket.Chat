import { IMessage, IRoom, isEditedMessage, isOmnichannelRoom, IOmnichannelMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server/index';
import OmniChannel from '../lib/OmniChannel';
import { normalizeMessageFileUpload } from '../../../utils/server/functions/normalizeMessageFileUpload';

callbacks.add(
	'afterSaveMessage',
	function (message: IMessage, room: IRoom): IMessage {
		// do nothing if room is not omnichannel room
		if (!isOmnichannelRoom(room)) {
			return message;
		}

		// skips this callback if the message was edited
		if (isEditedMessage(message)) {
			return message;
		}

		if (!settings.get('Livechat_Facebook_Enabled') || !settings.get('Livechat_Facebook_API_Key')) {
			return message;
		}

		// only send the sms by SMS if it is a livechat room with SMS set to true
		if (!room.facebook || !room.v?.token) {
			return message;
		}

		// if the message has a token, it was sent from the visitor, so ignore it
		if ((message as IOmnichannelMessage).token) {
			return message;
		}

		// if the message has a type means it is a special message (like the closing comment), so skips
		if (message.t) {
			return message;
		}

		if (message.file) {
			message = Promise.await(normalizeMessageFileUpload(message));
		}

		OmniChannel.reply({
			page: room?.facebook.page.id,
			token: room?.v.token,
			text: message.msg,
		});

		return message;
	},
	callbacks.priority.LOW,
	'sendMessageToFacebook',
);
