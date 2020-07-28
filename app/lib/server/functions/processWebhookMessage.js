import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';
import mem from 'mem';

import { getRoomByNameOrIdWithOptionToJoin } from './getRoomByNameOrIdWithOptionToJoin';
import { sendMessage } from './sendMessage';
import { validateRoomMessagePermissions } from '../../../authorization/server/functions/canSendMessage';
import { getDirectMessageByIdWithOptionToJoin, getDirectMessageByNameOrIdWithOptionToJoin } from './getDirectMessageByNameOrIdWithOptionToJoin';

// show deprecation warning only once per hour for each integration
const showDeprecation = mem(({ integration, channels, username }, error) => {
	console.warn(`Warning: The integration "${ integration }" failed to send a message to "${ [].concat(channels).join(',') }" because user "${ username }" doesn't have permission or is not a member of the channel.`);
	console.warn('This behavior is deprecated and starting from version v4.0.0 the following error will be thrown and the message will not be sent.');
	console.error(error);
}, { maxAge: 360000, cacheKey: (integration) => JSON.stringify(integration) });

export const processWebhookMessage = function(messageObj, user, defaultValues = { channel: '', alias: '', avatar: '', emoji: '' }, integration = null) {
	const sentData = [];
	const channels = [].concat(messageObj.channel || messageObj.roomId || defaultValues.channel);

	for (const channel of channels) {
		const channelType = channel[0];

		let channelValue = channel.substr(1);
		let room;

		switch (channelType) {
			case '#':
				room = getRoomByNameOrIdWithOptionToJoin({ currentUserId: user._id, nameOrId: channelValue, joinChannel: true });
				break;
			case '@':
				room = getDirectMessageByNameOrIdWithOptionToJoin({ currentUserId: user._id, nameOrId: channelValue });
				break;
			default:
				channelValue = channelType + channelValue;

				// Try to find the room by id or name if they didn't include the prefix.
				room = getRoomByNameOrIdWithOptionToJoin({ currentUserId: user._id, nameOrId: channelValue, joinChannel: true, errorOnEmpty: false });
				if (room) {
					break;
				}

				// We didn't get a room, let's try finding direct messages
				room = getDirectMessageByIdWithOptionToJoin({ currentUserId: user._id, nameOrId: channelValue });
				if (room) {
					break;
				}

				// No room, so throw an error
				throw new Meteor.Error('invalid-channel');
		}

		if (messageObj.attachments && !Array.isArray(messageObj.attachments)) {
			console.log('Attachments should be Array, ignoring value'.red, messageObj.attachments);
			messageObj.attachments = undefined;
		}

		const message = {
			alias: messageObj.username || messageObj.alias || defaultValues.alias,
			msg: s.trim(messageObj.text || messageObj.msg || ''),
			attachments: messageObj.attachments || [],
			parseUrls: messageObj.parseUrls !== undefined ? messageObj.parseUrls : !messageObj.attachments,
			bot: messageObj.bot,
			groupable: messageObj.groupable !== undefined ? messageObj.groupable : false,
			tmid: messageObj.tmid,
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

		if (_.isArray(message.attachments)) {
			for (let i = 0; i < message.attachments.length; i++) {
				const attachment = message.attachments[i];
				if (attachment.msg) {
					attachment.text = s.trim(attachment.msg);
					delete attachment.msg;
				}
			}
		}

		try {
			validateRoomMessagePermissions(room, { uid: user._id, ...user });
		} catch (error) {
			if (!integration) {
				throw error;
			}
			showDeprecation({
				integration: integration.name,
				channels: integration.channel,
				username: integration.username,
			}, error);
		}

		const messageReturn = sendMessage(user, message, room);
		sentData.push({ channel, message: messageReturn });
	}

	return sentData;
};
