import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { SMS } from '../../sms';
import { Uploads, LivechatVisitors } from '../../models';
import { normalizeMessageAttachments } from '../../utils/server/functions/normalizeMessageAttachments';

callbacks.add('afterSaveMessage', function(message, room) {
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
		message = normalizeMessageAttachments(message);
		const { _id } = message.file;
		const file = Uploads.findOneById(_id);
		console.log('file');
		console.log(file);
		if (file) {
			const { type, size } = file;
			const { attachments, rid, u: { _id: userId } = {} } = message;
			const [attachment] = attachments;
			const { title_link: url } = attachment;

			extraData = Object.assign({}, { rid, userId, type, size, url });
		}
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
}, callbacks.priority.LOW, 'sendMessageBySms');
