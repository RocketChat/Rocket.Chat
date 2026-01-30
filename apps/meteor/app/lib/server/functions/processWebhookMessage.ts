import type { IMessage, IUser, RequiredField, MessageAttachment, IRoom } from '@rocket.chat/core-typings';
import { removeEmpty } from '@rocket.chat/tools';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { getRoomByNameOrIdWithOptionToJoin } from './getRoomByNameOrIdWithOptionToJoin';
import { sendMessage, validateMessage } from './sendMessage';
import { ensureArray } from '../../../../lib/utils/arrayUtils';
import { trim } from '../../../../lib/utils/stringUtils';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { validateRoomMessagePermissionsAsync } from '../../../authorization/server/functions/canSendMessage';
import { settings } from '../../../settings/server';

type Payload = {
	channel?: string | string[];
	roomId?: string | string[];
	text?: IMessage['msg'];
	msg?: IMessage['msg']; // overridden if text is present
	username?: IMessage['alias'];
	alias?: IMessage['alias']; // overridden if username is present
	icon_emoji?: IMessage['emoji'];
	emoji?: IMessage['emoji']; // overridden if icon_emoji is present
	icon_url?: IMessage['avatar'];
	avatar?: IMessage['avatar']; // overridden if icon_url is present
	attachments?: IMessage['attachments'];
	parseUrls?: boolean;
	bot?: IMessage['bot'];
	groupable?: IMessage['groupable'];
	tmid?: IMessage['tmid'];
	customFields?: IMessage['customFields'];
};

type DefaultValues = {
	channel: string | string[];
	alias: string;
	avatar: string;
	emoji: string;
};

export type WebhookSuccessItem = { channel: string; error?: undefined; message: IMessage };
export type WebhookFailureItem = { channel: string; error: string; message?: undefined };
export type WebhookResponseItem = WebhookFailureItem | WebhookSuccessItem;

export const validateWebhookMessage = async (message: Partial<IMessage>, room: IRoom | null, user: IUser) => {
	if (message.msg) {
		if (message.msg.length > (settings.get<number>('Message_MaxAllowedSize') ?? 0)) {
			throw Error('error-message-size-exceeded');
		}
	}
	await validateMessage(message, room, user);
};

const getRoomWithOptionToJoin = async (channelType: string, channelValue: string, user: IUser) => {
	switch (channelType) {
		case '#':
			return getRoomByNameOrIdWithOptionToJoin({
				user,
				nameOrId: channelValue,
				joinChannel: true,
			});
		case '@':
			return getRoomByNameOrIdWithOptionToJoin({
				user,
				nameOrId: channelValue,
				type: 'd',
			});
		default:
			const _channelValue = channelType + channelValue;

			// Try to find the room by id or name if they didn't include the prefix.
			let room = await getRoomByNameOrIdWithOptionToJoin({
				user,
				nameOrId: _channelValue,
				joinChannel: true,
				errorOnEmpty: false,
			});
			if (room) {
				return room;
			}

			// We didn't get a room, let's try finding direct messages
			room = await getRoomByNameOrIdWithOptionToJoin({
				user,
				nameOrId: _channelValue,
				tryDirectByUserIdOnly: true,
				type: 'd',
			});
			if (room) {
				return room;
			}

			// No room, so throw an error
			throw new Meteor.Error('invalid-channel');
	}
};

const buildMessage = (messageObj: Payload, defaultValues: DefaultValues) => {
	const message: Partial<IMessage> & { parseUrls?: boolean } = {
		alias: messageObj.username || messageObj.alias || defaultValues.alias,
		msg: trim(messageObj.text || messageObj.msg || ''),
		attachments: messageObj.attachments || [],
		parseUrls: messageObj.parseUrls !== undefined ? messageObj.parseUrls : !messageObj.attachments,
		bot: messageObj.bot,
		groupable: messageObj.groupable !== undefined ? messageObj.groupable : false,
		tmid: messageObj.tmid,
		customFields: messageObj.customFields,
	};

	if (!_.isEmpty(messageObj.icon_url) || !_.isEmpty(messageObj.avatar)) {
		message.avatar = messageObj.icon_url || messageObj.avatar;
	} else if (!_.isEmpty(messageObj.icon_emoji) || !_.isEmpty(messageObj.emoji)) {
		message.emoji = messageObj.icon_emoji || messageObj.emoji;
	} else if (!_.isEmpty(defaultValues.avatar)) {
		message.avatar = defaultValues.avatar;
	} else if (!_.isEmpty(defaultValues.emoji)) {
		message.emoji = defaultValues.emoji;
	}

	if (Array.isArray(message.attachments)) {
		for (let i = 0; i < message.attachments.length; i++) {
			const attachment = message.attachments[i] as MessageAttachment & { msg?: string };
			if (attachment.msg) {
				attachment.text = trim(attachment.msg);
				delete attachment.msg;
			}
		}
	}

	return message;
};

export function processWebhookMessage(
	messageObj: Payload & { separateResponse: true },
	user: IUser & { username: RequiredField<IUser, 'username'> },
	defaultValues?: DefaultValues,
): Promise<WebhookResponseItem[]>;

export function processWebhookMessage(
	messageObj: Payload & { separateResponse?: false | undefined },
	user: IUser & { username: RequiredField<IUser, 'username'> },
	defaultValues?: DefaultValues,
): Promise<WebhookSuccessItem[]>;

export async function processWebhookMessage(
	messageObj: Payload & {
		/**
		 * If true, the response will be sent separately for each channel. Messages will be sent to other channels even if one or more fails. If false or not provided, messages would not be sent to any channel if one or more fails.
		 */
		separateResponse?: boolean;
	},
	user: IUser & { username: RequiredField<IUser, 'username'> },
	defaultValues: DefaultValues = { channel: '', alias: '', avatar: '', emoji: '' },
) {
	const rooms: ({ channel: string } & ({ room: IRoom } | { room: IRoom | null; error?: any }))[] = [];
	const sentData: WebhookResponseItem[] = [];

	const channels: Array<string> = [...new Set(ensureArray(messageObj.channel || messageObj.roomId || defaultValues.channel))];

	if (messageObj.attachments && !Array.isArray(messageObj.attachments)) {
		SystemLogger.warn({
			msg: 'Attachments should be Array, ignoring value',
			attachments: messageObj.attachments,
		});
		messageObj.attachments = undefined;
	}

	const message = buildMessage(messageObj, defaultValues);

	for await (const channel of channels) {
		const channelType = channel[0];
		const channelValue = channel.slice(1);
		let room: IRoom | null = null;
		try {
			room = await getRoomWithOptionToJoin(channelType, channelValue, user);
			if (!room) {
				throw new Error('error-invalid-room');
			}
			await validateRoomMessagePermissionsAsync(room, { uid: user._id, ...user });
			await validateWebhookMessage(message, room, user);
			rooms.push({ room, channel });
		} catch (_error: any) {
			if (messageObj.separateResponse) {
				const { error, message } = _error || {};
				const errorMessage = error || message || 'unknown-error';
				rooms.push({ error: errorMessage, room, channel });
				continue;
			}
			throw _error;
		}
	}

	for await (const roomData of rooms) {
		if ('error' in roomData && roomData.error) {
			if (messageObj.separateResponse) {
				sentData.push({ channel: roomData.channel, error: roomData.error });
				continue;
			}
		}
		const messageReturn = await sendMessage(user, removeEmpty(message), roomData.room);
		sentData.push({ channel: roomData.channel, message: messageReturn });
	}

	return sentData;
}
