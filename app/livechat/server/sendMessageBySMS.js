import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings';
import { SMS } from '../../sms';
import { LivechatVisitors } from '../../models';
import { normalizeMessageFileUpload } from '../../utils/server/functions/normalizeMessageFileUpload';

callbacks.add(
	'afterSaveMessage',
	function (message, room) {
		// skips this callback if the message was edited
		if (message.editedAt) {
			return message;
		}

		if (!SMS.enabled) {
			return message;
		}

		// only send the sms by SMS if it is a livechat room with SMS set to true
		if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.sms && room.v && room.v.token)) {
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

		let extraData;
		if (message.file) {
			message = Promise.await(normalizeMessageFileUpload(message));
			const { fileUpload, rid, u: { _id: userId } = {} } = message;
			extraData = Object.assign({}, { rid, userId, fileUpload });
		}

		if (message.location) {
			const { location } = message;
			extraData = Object.assign({}, extraData, { location });
		}

		const SMSService = SMS.getService(settings.get('SMS_Service'));

		if (!SMSService) {
			return message;
		}

		const visitor = LivechatVisitors.getVisitorByToken(room.v.token);

		if (!visitor || !visitor.phone || visitor.phone.length === 0) {
			return message;
		}

		SMSService.send(room.sms.from, visitor.phone[0].phoneNumber, message.msg, extraData);

		return message;
	},
	callbacks.priority.LOW,
	'sendMessageBySms',
);
