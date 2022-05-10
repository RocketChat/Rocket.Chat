import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings';
import OmniChannel from '../lib/OmniChannel';
import { normalizeMessageFileUpload } from '../../../utils/server/functions/normalizeMessageFileUpload';

callbacks.add(
	'afterSaveMessage',
	function (message, room) {
		// skips this callback if the message was edited
		if (message.editedAt) {
			return message;
		}

		if (!settings.get('Livechat_Facebook_Enabled') || !settings.get('Livechat_Facebook_API_Key')) {
			return message;
		}

		// only send the sms by SMS if it is a livechat room with SMS set to true
		if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.facebook && room.v && room.v.token)) {
			return message;
		}

		// if the message has a token, it was sent from the visitor, so ignore it
		if (message.token) {
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
			page: room.facebook.page.id,
			token: room.v.token,
			text: message.msg,
		});

		return message;
	},
	callbacks.priority.LOW,
	'sendMessageToFacebook',
);
