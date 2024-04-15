import type { IMessage, IUser, RequiredField, MessageAttachment } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { ensureArray } from '../../../../lib/utils/arrayUtils';
import { trim } from '../../../../lib/utils/stringUtils';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { validateRoomMessagePermissionsAsync } from '../../../authorization/server/functions/canSendMessage';
import { getRoomByNameOrIdWithOptionToJoin } from './getRoomByNameOrIdWithOptionToJoin';
import { sendMessage } from './sendMessage';

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
};

type DefaultValues = {
	channel: string | string[];
	alias: string;
	avatar: string;
	emoji: string;
};

type User = IUser & { username: RequiredField<IUser, 'username'> };

const getRoom = async (nameOrId: string, channelType: string, user: User) => {
	switch (channelType) {
		case '#':
			return getRoomByNameOrIdWithOptionToJoin({
				user,
				nameOrId,
				joinChannel: true,
			});
		case '@':
			return getRoomByNameOrIdWithOptionToJoin({
				user,
				nameOrId,
				type: 'd',
			});
		default:
			nameOrId = channelType + nameOrId;

			// Try to find the room by id or name if they didn't include the prefix.
			const room = await getRoomByNameOrIdWithOptionToJoin({
				user,
				nameOrId,
				joinChannel: true,
				errorOnEmpty: false,
			});

			if (room) {
				return room;
			}

			// We didn't get a room, let's try finding direct messages
			return getRoomByNameOrIdWithOptionToJoin({
				user,
				nameOrId,
				tryDirectByUserIdOnly: true,
				type: 'd',
			});
	}
};

export const processWebhookMessage = async function (
	messageObj: Payload,
	user: User,
	defaultValues: DefaultValues = { channel: '', alias: '', avatar: '', emoji: '' },
) {
	const sentData = [];

	const channels: Array<string> = [...new Set(ensureArray(messageObj.channel || messageObj.roomId || defaultValues.channel))];

	for await (const channel of channels) {
		const channelType = channel[0];

		const channelValue = channel.substring(1);

		const room = await getRoom(channelValue, channelType, user);

		if (!room) {
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
		};

		if ((messageObj.icon_url && messageObj.icon_url.length > 0) || (messageObj.avatar && messageObj.avatar.length > 0)) {
			message.avatar = messageObj.icon_url || messageObj.avatar;
		} else if (
			(messageObj.icon_emoji && messageObj.icon_emoji.length > 0) ||
			(messageObj.emoji && messageObj.icon_emoji && messageObj.icon_emoji.length > 0)
		) {
			message.emoji = messageObj.icon_emoji || messageObj.emoji;
		} else if (defaultValues.avatar?.length > 0) {
			message.avatar = defaultValues.avatar;
		} else if (defaultValues.emoji?.length > 0) {
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

		const messageReturn = await sendMessage(user, message, room);
		sentData.push({ channel, message: messageReturn });
	}

	return sentData;
};
