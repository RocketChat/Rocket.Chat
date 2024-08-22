import { OmnichannelIntegration } from '@rocket.chat/core-services';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings/server';
import { normalizeMessageFileUpload } from '../../utils/server/functions/normalizeMessageFileUpload';
import { callbackLogger } from './lib/logger';

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message, { room }) => {
		// skips this callback if the message was edited
		if (isEditedMessage(message)) {
			return message;
		}

		if (!settings.get('SMS_Enabled')) {
			return message;
		}

		// only send the sms by SMS if it is a livechat room with SMS set to true
		if (!(room.sms && room.v && room.v.token)) {
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

		const { rid, u: { _id: userId } = {} } = message;
		let extraData = { rid, userId };
		if (message.file) {
			message = { ...(await normalizeMessageFileUpload(message)), ...{ _updatedAt: message._updatedAt } };
			const { fileUpload } = message;
			extraData = Object.assign({}, extraData, { fileUpload });
		}

		if (message.location) {
			const { location } = message;
			extraData = Object.assign({}, extraData, { location });
		}
		const service = settings.get<string>('SMS_Service');

		const SMSService = await OmnichannelIntegration.getSmsService(service);

		if (!SMSService) {
			callbackLogger.debug('SMS Service is not configured, skipping SMS send');
			return message;
		}

		const visitor = await LivechatVisitors.getVisitorByToken(room.v.token, { projection: { phone: 1 } });

		if (!visitor?.phone || visitor.phone.length === 0) {
			return message;
		}

		try {
			await SMSService.send(room.sms.from, visitor.phone[0].phoneNumber, message.msg, extraData);
			callbackLogger.debug(`SMS message sent to ${visitor.phone[0].phoneNumber} via ${service}`);
		} catch (e) {
			callbackLogger.error(e);
		}

		return message;
	},
	callbacks.priority.LOW,
	'sendMessageBySms',
);
