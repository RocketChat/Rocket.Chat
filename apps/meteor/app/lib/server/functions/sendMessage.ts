import { Apps } from '@rocket.chat/apps';
import { api, Message } from '@rocket.chat/core-services';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';

import { isRelativeURL } from '../../../../lib/utils/isRelativeURL';
import { isURL } from '../../../../lib/utils/isURL';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { FileUpload } from '../../../file-upload/server';
import { settings } from '../../../settings/server';
import { afterSaveMessage } from '../lib/afterSaveMessage';
import { notifyOnRoomChangedById, notifyOnMessageChange } from '../lib/notifyListener';
import { validateCustomMessageFields } from '../lib/validateCustomMessageFields';
import { parseUrlsInMessage } from './parseUrlsInMessage';

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

const objectMaybeIncluding = (types: any) =>
	Match.Where((value: any) => {
		Object.keys(types).forEach((field) => {
			if (value[field] != null) {
				try {
					check(value[field], types[field]);
				} catch (error: any) {
					error.path = field;
					throw error;
				}
			}
		});

		return true;
	});

const validateAttachmentsFields = (attachmentField: any) => {
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

const validateAttachmentsActions = (attachmentActions: any) => {
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

const validateAttachment = (attachment: any) => {
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

	if (attachment.fields?.length) {
		attachment.fields.map(validateAttachmentsFields);
	}

	if (attachment.actions?.length) {
		attachment.actions.map(validateAttachmentsActions);
	}
};

const validateBodyAttachments = (attachments: any[]) => attachments.map(validateAttachment);

export const validateMessage = async (message: any, room: any, user: any) => {
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

	if (!Match.test(message.msg, String)) {
		message.msg = '';
	}

	if (message.ts == null) {
		message.ts = new Date();
	}
}

/**
 * Validates and sends the message object.
 */
export const sendMessage = async function (user: any, message: any, room: any, upsert = false, previewUrls?: string[]) {
	if (!user || !message || !room._id) {
		return false;
	}

	await validateMessage(message, room, user);
	prepareMessageObject(message, room._id, user);

	if (message.t === 'otr') {
		void api.broadcast('otrMessage', { roomId: message.rid, message, user, room });
		return message;
	}

	if (settings.get('Message_Read_Receipt_Enabled')) {
		message.unread = true;
	}

	// For the Rocket.Chat Apps :)
	if (Apps.self?.isLoaded()) {
		const listenerBridge = Apps.getBridges()?.getListenerBridge();

		const prevent = await listenerBridge?.messageEvent('IPreMessageSentPrevent', message);
		if (prevent) {
			return;
		}

		const result = await listenerBridge?.messageEvent(
			'IPreMessageSentModify',
			await listenerBridge?.messageEvent('IPreMessageSentExtend', message),
		);

		if (typeof result === 'object') {
			message = Object.assign(message, result);

			// Some app may have inserted malicious/invalid values in the message, let's check it again
			await validateMessage(message, room, user);
		}
	}

	parseUrlsInMessage(message, previewUrls);

	message = await Message.beforeSave({ message, room, user });

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
		// This returns a promise, but it won't mutate anything about the message
		// so, we don't really care if it is successful or fails
		void Apps.getBridges()?.getListenerBridge().messageEvent('IPostMessageSent', message);
	}

	// TODO: is there an opportunity to send returned data to notifyOnMessageChange?
	await afterSaveMessage(message, room);

	void notifyOnMessageChange({ id: message._id });

	void notifyOnRoomChangedById(message.rid);

	return message;
};
