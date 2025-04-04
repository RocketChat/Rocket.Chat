import type { IMessage, IUser, RequiredField, MessageAttachment } from '@rocket.chat/core-typings';
import { removeEmpty } from '@rocket.chat/tools';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { getRoomByNameOrIdWithOptionToJoin } from './getRoomByNameOrIdWithOptionToJoin';
import { sendMessage } from './sendMessage';
import { ensureArray } from '../../../../lib/utils/arrayUtils';
import { trim } from '../../../../lib/utils/stringUtils';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { validateRoomMessagePermissionsAsync } from '../../../authorization/server/functions/canSendMessage';

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

export const processWebhookMessage = async function (
	messageObj: Payload,
	user: IUser & { username: RequiredField<IUser, 'username'> },
	defaultValues: DefaultValues = { channel: '', alias: '', avatar: '', emoji: '' },
) {
	const sentData = [];

	const channels: Array<string> = [...new Set(ensureArray(messageObj.channel || messageObj.roomId || defaultValues.channel))];

	for await (const channel of channels) {
		const channelType = channel[0];

		let channelValue = channel.substr(1);
		let room;

		switch (channelType) {
			case '#':
				room = await getRoomByNameOrIdWithOptionToJoin({
					user,
					nameOrId: channelValue,
					joinChannel: true,
				});
				break;
			case '@':
				room = await getRoomByNameOrIdWithOptionToJoin({
					user,
					nameOrId: channelValue,
					type: 'd',
				});
				break;
			default:
				channelValue = channelType + channelValue;

				// Try to find the room by id or name if they didn't include the prefix.
				room = await getRoomByNameOrIdWithOptionToJoin({
					user,
					nameOrId: channelValue,
					joinChannel: true,
					errorOnEmpty: false,
				});
				if (room) {
					break;
				}

				// We didn't get a room, let's try finding direct messages
				room = await getRoomByNameOrIdWithOptionToJoin({
					user,
					nameOrId: channelValue,
					tryDirectByUserIdOnly: true,
					type: 'd',
				});
				if (room) {
					break;
				}

				// No room, so throw an error
				throw new Meteor.Error('invalid-channel');
		}

		if (messageObj.attachments && !Array.isArray(messageObj.attachments)) {
			SystemLogger.warn({
				msg: 'Attachments should be Array, ignoring value',
				attachments: messageObj.attachments,
			});
			messageObj.attachments = undefined;
		}

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

		await validateRoomMessagePermissionsAsync(room, { uid: user._id, ...user });

		const messageReturn = await sendMessage(user, removeEmpty(message), room);
		sentData.push({ channel, message: messageReturn });
	}

	return sentData;
};
