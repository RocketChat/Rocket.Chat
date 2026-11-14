import { AppEvents, Apps } from '@rocket.chat/apps';
import { Message } from '@rocket.chat/core-services';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { isAbsoluteURL, isRecord } from '@rocket.chat/tools';

import { isRelativeURL } from '../../../lib/utils/isRelativeURL';
import { afterSaveMessage } from '../../hooks/messages/afterSaveMessage';
import { settings } from '../../settings';
import { hasPermissionAsync } from '../authorization/hasPermission';
import { FileUpload } from '../media/file-upload';
import { validateCustomMessageFields } from '../messaging/validateCustomMessageFields';
import { notifyOnRoomChangedById } from '../notifyListener';

export type SendMessageOptions = {
	upsert?: boolean;
	previewUrls?: string[];
	skipNotifications?: boolean;
};

// TODO: most of the types here are wrong, but I don't want to change them now

/**
 * IMPORTANT
 *
 * This validator prevents malicious href values
 * intending to run arbitrary js code in anchor tags.
 * You should use it whenever the value you're checking
 * is going to be rendered in the href attribute of a
 * link.
 */
const validFullURLParam = (value: unknown) => {
	if (typeof value !== 'string' || (!isAbsoluteURL(value) && !value.startsWith(FileUpload.getPath())) || /^javascript:/i.test(value)) {
		throw new Error('Invalid href value provided');
	}

	return true;
};

const validPartialURLParam = (value: unknown) => {
	if (
		typeof value !== 'string' ||
		(!isRelativeURL(value) && !isAbsoluteURL(value) && !value.startsWith(FileUpload.getPath())) ||
		/^javascript:/i.test(value)
	) {
		throw new Error('Invalid href value provided');
	}

	return true;
};

const isString = (value: unknown) => typeof value === 'string';
const isNumber = (value: unknown) => typeof value === 'number';
const isBoolean = (value: unknown) => typeof value === 'boolean';

const validateFieldsWhenPresent = (value: any, validators: Record<string, (fieldValue: unknown) => boolean>) => {
	Object.entries(validators).forEach(([field, isValid]) => {
		if (value[field] != null && !isValid(value[field])) {
			throw new Error(`Invalid value for field ${field}`);
		}
	});
};

const validateAttachmentsFields = (attachmentField: any) => {
	validateFieldsWhenPresent(attachmentField, {
		short: isBoolean,
		title: isString,
		value: (value) => isString(value) || isNumber(value) || isBoolean(value),
	});

	if (!attachmentField.value || !attachmentField.title) {
		throw new Error('Invalid attachment field, title and value is required');
	}
};

const validateAttachmentsActions = (attachmentActions: any) => {
	validateFieldsWhenPresent(attachmentActions, {
		type: isString,
		text: isString,
		url: validFullURLParam,
		image_url: validFullURLParam,
		is_webview: isBoolean,
		webview_height_ratio: isString,
		msg: isString,
		msg_in_chat_window: isBoolean,
	});
};

const validateAttachment = (attachment: any) => {
	validateFieldsWhenPresent(attachment, {
		color: isString,
		text: isString,
		ts: (value) => isString(value) || isNumber(value),
		thumb_url: validFullURLParam,
		button_alignment: isString,
		actions: Array.isArray,
		message_link: validFullURLParam,
		collapsed: isBoolean,
		author_name: isString,
		author_link: validFullURLParam,
		author_icon: validFullURLParam,
		title: isString,
		title_link: validFullURLParam,
		title_link_download: isBoolean,
		image_dimensions: isRecord,
		image_url: validFullURLParam,
		image_preview: isString,
		image_type: isString,
		image_size: isNumber,
		audio_url: validFullURLParam,
		audio_type: isString,
		audio_size: isNumber,
		video_url: validFullURLParam,
		video_type: isString,
		video_size: isNumber,
		fields: Array.isArray,
	});

	if (attachment.fields?.length) {
		attachment.fields.map(validateAttachmentsFields);
	}

	if (attachment.actions?.length) {
		attachment.actions.map(validateAttachmentsActions);
	}
};

const validateBodyAttachments = (attachments: any[]) => attachments.map(validateAttachment);

export const validateMessage = async (message: any, room: any, user: any) => {
	validateFieldsWhenPresent(message, {
		_id: isString,
		msg: isString,
		text: isString,
		alias: isString,
		emoji: isString,
		tmid: isString,
		tshow: isBoolean,
		avatar: validPartialURLParam,
		attachments: Array.isArray,
		blocks: Array.isArray,
	});

	if (message.alias || message.avatar) {
		const isLiveChatGuest = !message.avatar && user.token && user.token === room.v?.token;

		if (!isLiveChatGuest && !(await hasPermissionAsync(user._id, 'message-impersonate', room._id))) {
			throw new Error('Not enough permission');
		}
	}

	if (Array.isArray(message.attachments) && message.attachments.length) {
		validateBodyAttachments(message.attachments);
	}

	if (message.customFields) {
		validateCustomMessageFields({
			customFields: message.customFields,
			messageCustomFieldsEnabled: settings.get<boolean>('Message_CustomFields_Enabled'),
			messageCustomFields: settings.get<string>('Message_CustomFields'),
		});
	}
};

export function prepareMessageObject(
	message: Partial<IMessage>,
	rid: IRoom['_id'],
	user: { _id: string; username?: string; name?: string },
): asserts message is IMessage {
	if (!message.ts) {
		message.ts = new Date();
	}

	if (message.tshow !== true) {
		delete message.tshow;
	}

	const { _id, username, name } = user;
	message.u = {
		_id,
		username: username as string, // FIXME: this is wrong but I don't want to change it now
		name,
	};
	message.rid = rid;

	if (typeof message.msg !== 'string') {
		message.msg = '';
	}

	if (message.ts == null) {
		message.ts = new Date();
	}
}

/**
 * Validates and sends the message object. This function does not verify the Message_MaxAllowedSize settings.
 * Caller of the function should verify the Message_MaxAllowedSize if needed.
 * There might be same use cases which needs to override this setting. Example - sending error logs.
 */
export const sendMessage = async function (user: any, message: any, room: any, options: SendMessageOptions = {}) {
	const { upsert = false, previewUrls } = options;

	if (!user || !message || !room._id) {
		return false;
	}

	await validateMessage(message, room, user);
	prepareMessageObject(message, room._id, user);

	if (settings.get('Message_Read_Receipt_Enabled')) {
		message.unread = true;
	}

	// For the Rocket.Chat Apps :)
	if (Apps.self?.isLoaded()) {
		const prevent = await Apps.self?.triggerEvent(AppEvents.IPreMessageSentPrevent, message);

		if (prevent) {
			return;
		}

		const result = await Apps.self?.triggerEvent(
			AppEvents.IPreMessageSentModify,
			await Apps.self?.triggerEvent(AppEvents.IPreMessageSentExtend, message),
		);

		if (typeof result === 'object') {
			message = Object.assign(message, result);

			// Some app may have inserted malicious/invalid values in the message, let's check it again
			await validateMessage(message, room, user);
		}
	}

	message = await Message.beforeSave({ message, room, user, previewUrls, parseUrls: message.parseUrls });

	if (!message) {
		return;
	}

	if (message._id && upsert) {
		const { _id } = message;
		delete message._id;
		await Messages.updateOne(
			{
				_id,
				'u._id': message.u._id,
			},
			{ $set: message },
			{ upsert: true },
		);
		message._id = _id;
	} else {
		const messageAlreadyExists = message._id && (await Messages.findOneById(message._id, { projection: { _id: 1 } }));
		if (messageAlreadyExists) {
			return;
		}
		const { insertedId } = await Messages.insertOne(message);
		message._id = insertedId;
	}

	if (Apps.self?.isLoaded()) {
		// If the message has a type (system message), we should notify the listener about it
		const messageEvent = message.t ? AppEvents.IPostSystemMessageSent : AppEvents.IPostMessageSent;
		void Apps.self?.triggerEvent(messageEvent, message);
	}

	await afterSaveMessage(message, room, user, { options });

	void notifyOnRoomChangedById(message.rid);

	return message;
};
