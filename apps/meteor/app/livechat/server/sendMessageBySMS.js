import { LivechatVisitors } from '@rocket.chat/models';

import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings/server';
import { SMS } from '../../sms';
import { normalizeMessageFileUpload } from '../../utils/server/functions/normalizeMessageFileUpload';
import { callbackLogger } from './lib/callbackLogger';

callbacks.add(
	'afterSaveMessage',
	function (message, room) {
		callbackLogger.debug('Attempting to send SMS message');
		// skips this callback if the message was edited
		if (message.editedAt) {
			callbackLogger.debug('Message was edited, skipping SMS send');
			return message;
		}

		if (!SMS.enabled) {
			callbackLogger.debug('SMS is not enabled, skipping SMS send');
			return message;
		}

		// only send the sms by SMS if it is a livechat room with SMS set to true
		if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.sms && room.v && room.v.token)) {
			callbackLogger.debug('Room is not a livechat room, skipping SMS send');
			return message;
		}

		// if the message has a token, it was sent from the visitor, so ignore it
		if (message.token) {
			callbackLogger.debug('Message was sent from the visitor, skipping SMS send');
			return message;
		}

		// if the message has a type means it is a special message (like the closing comment), so skips
		if (message.t) {
			callbackLogger.debug('Message is a special message, skipping SMS send');
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
			callbackLogger.debug('SMS Service is not configured, skipping SMS send');
			return message;
		}

		const visitor = Promise.await(LivechatVisitors.getVisitorByToken(room.v.token));

		if (!visitor || !visitor.phone || visitor.phone.length === 0) {
			callbackLogger.debug('Visitor does not have a phone number, skipping SMS send');
			return message;
		}

		try {
			callbackLogger.debug(`Message will be sent to ${visitor.phone[0].phoneNumber} through service ${settings.get('SMS_Service')}`);
			SMSService.send(room.sms.from, visitor.phone[0].phoneNumber, message.msg, extraData);
			callbackLogger.debug(`SMS message sent to ${visitor.phone[0].phoneNumber}`);
		} catch (e) {
			callbackLogger.error(e);
		}

		return message;
	},
	callbacks.priority.LOW,
	'sendMessageBySms',
);
