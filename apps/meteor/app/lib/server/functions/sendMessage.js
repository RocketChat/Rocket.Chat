import { Match, check } from 'meteor/check';

import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { Messages } from '../../../models/server';
import { Apps } from '../../../apps/server';
import { isURL } from '../../../../lib/utils/isURL';
import { FileUpload } from '../../../file-upload/server';
import { hasPermission } from '../../../authorization/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { parseUrlsInMessage } from './parseUrlsInMessage';
import { isRelativeURL } from '../../../../lib/utils/isRelativeURL';
import notifications from '../../../notifications/server/lib/Notifications';

/**
 * IMPORTANT
 *
 * This validator prevents malicious href values
 * intending to run arbitrary js code in anchor tags.
 * You should use it whenever the value you're checking
 * is going to be rendered in the href attribute of a
 * link.
 */
const validFullURLParam = Match.Where((value) => {
	check(value, String);

	if (!isURL(value) && !value.startsWith(FileUpload.getPath())) {
		throw new Error('Invalid href value provided');
	}

	if (/^javascript:/i.test(value)) {
		throw new Error('Invalid href value provided');
	}

	return true;
});

const validPartialURLParam = Match.Where((value) => {
	check(value, String);

	if (!isRelativeURL(value) && !isURL(value) && !value.startsWith(FileUpload.getPath())) {
		throw new Error('Invalid href value provided');
	}

	if (/^javascript:/i.test(value)) {
		throw new Error('Invalid href value provided');
	}

	return true;
});

const objectMaybeIncluding = (types) =>
	Match.Where((value) => {
		Object.keys(types).forEach((field) => {
			if (value[field] != null) {
				try {
					check(value[field], types[field]);
				} catch (error) {
					error.path = field;
					throw error;
				}
			}
		});

		return true;
	});

const validateAttachmentsFields = (attachmentField) => {
	check(
		attachmentField,
		objectMaybeIncluding({
			short: Boolean,
			title: String,
			value: Match.OneOf(String, Number, Boolean),
		}),
	);

	if (typeof attachmentField.value !== 'undefined') {
		attachmentField.value = String(attachmentField.value);
	}
};

const validateAttachmentsActions = (attachmentActions) => {
	check(
		attachmentActions,
		objectMaybeIncluding({
			type: String,
			text: String,
			url: validFullURLParam,
			image_url: validFullURLParam,
			is_webview: Boolean,
			webview_height_ratio: String,
			msg: String,
			msg_in_chat_window: Boolean,
		}),
	);
};

const validateAttachment = (attachment) => {
	check(
		attachment,
		objectMaybeIncluding({
			color: String,
			text: String,
			ts: Match.OneOf(String, Number),
			thumb_url: validFullURLParam,
			button_alignment: String,
			actions: [Match.Any],
			message_link: validFullURLParam,
			collapsed: Boolean,
			author_name: String,
			author_link: validFullURLParam,
			author_icon: validFullURLParam,
			title: String,
			title_link: validFullURLParam,
			title_link_download: Boolean,
			image_dimensions: Object,
			image_url: validFullURLParam,
			image_preview: String,
			image_type: String,
			image_size: Number,
			audio_url: validFullURLParam,
			audio_type: String,
			audio_size: Number,
			video_url: validFullURLParam,
			video_type: String,
			video_size: Number,
			fields: [Match.Any],
		}),
	);

	if (attachment.fields && attachment.fields.length) {
		attachment.fields.map(validateAttachmentsFields);
	}

	if (attachment.actions && attachment.actions.length) {
		attachment.actions.map(validateAttachmentsActions);
	}
};

const validateBodyAttachments = (attachments) => attachments.map(validateAttachment);

export const validateMessage = (message, room, user) => {
	check(
		message,
		objectMaybeIncluding({
			_id: String,
			msg: String,
			text: String,
			alias: String,
			emoji: String,
			tmid: String,
			tshow: Boolean,
			avatar: validPartialURLParam,
			attachments: [Match.Any],
			blocks: [Match.Any],
		}),
	);

	if (message.alias || message.avatar) {
		const isLiveChatGuest = !message.avatar && user.token && user.token === room.v?.token;

		if (!isLiveChatGuest && !hasPermission(user._id, 'message-impersonate', room._id)) {
			throw new Error('Not enough permission');
		}
	}

	if (Array.isArray(message.attachments) && message.attachments.length) {
		validateBodyAttachments(message.attachments);
	}
};

export const prepareMessageObject = function (message, rid, user) {
	if (!message.ts) {
		message.ts = new Date();
	}

	if (message.tshow !== true) {
		delete message.tshow;
	}

	const { _id, username, name } = user;
	message.u = {
		_id,
		username,
		name,
	};
	message.rid = rid;

	if (!Match.test(message.msg, String)) {
		message.msg = '';
	}

	if (message.ts == null) {
		message.ts = new Date();
	}
};

/**
 * Clean up the message object before saving on db
 * @param {IMessage} message
 */
function cleanupMessageObject(message) {
	['customClass'].forEach((field) => delete message[field]);
}

export const sendMessage = function (user, message, room, upsert = false) {
	if (!user || !message || !room._id) {
		return false;
	}

	validateMessage(message, room, user);
	prepareMessageObject(message, room._id, user);

	if (settings.get('Message_Read_Receipt_Enabled')) {
		message.unread = true;
	}

	// For the Rocket.Chat Apps :)
	if (Apps && Apps.isLoaded()) {
		const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentPrevent', message));
		if (prevent) {
			if (settings.get('Apps_Framework_Development_Mode')) {
				SystemLogger.info({ msg: 'A Rocket.Chat App prevented the message sending.', message });
			}

			return;
		}

		let result;
		result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentExtend', message));
		result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentModify', result));

		if (typeof result === 'object') {
			message = Object.assign(message, result);

			// Some app may have inserted malicious/invalid values in the message, let's check it again
			validateMessage(message, room, user);
		}
	}

	cleanupMessageObject(message);

	parseUrlsInMessage(message);

	message = callbacks.run('beforeSaveMessage', message, room);
	if (message) {
		if (message.t === 'otr') {
			const otrStreamer = notifications.streamRoomMessage;
			otrStreamer.emit(message.rid, message, user, room);
		} else if (message._id && upsert) {
			const { _id } = message;
			delete message._id;
			Messages.upsert(
				{
					_id,
					'u._id': message.u._id,
				},
				message,
			);
			message._id = _id;
		} else {
			const messageAlreadyExists = message._id && Messages.findOneById(message._id, { fields: { _id: 1 } });
			if (messageAlreadyExists) {
				return;
			}
			message._id = Messages.insert(message);
		}

		if (Apps && Apps.isLoaded()) {
			// This returns a promise, but it won't mutate anything about the message
			// so, we don't really care if it is successful or fails
			Apps.getBridges().getListenerBridge().messageEvent('IPostMessageSent', message);
		}

		/*
		Defer other updates as their return is not interesting to the user
		*/

		// Execute all callbacks
		callbacks.runAsync('afterSaveMessage', message, room);
		return message;
	}
};
