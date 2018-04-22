import _ from 'underscore';
import s from 'underscore.string';

const getRoom = function(channelType, currentUserId, nameOrId, historyId, isIncoming) {
	switch (channelType) {
		case '#':
			return RocketChat.getRoomByNameOrIdWithOptionToJoin({ currentUserId, nameOrId, joinChannel: true });
		case '@':
			return RocketChat.getRoomByNameOrIdWithOptionToJoin({ currentUserId, nameOrId, type: 'd' });
		default:
			//Try to find the room by id or name if they didn't include the prefix.
			let room = RocketChat.getRoomByNameOrIdWithOptionToJoin({ currentUserId, nameOrId, joinChannel: true, errorOnEmpty: false });
			if (room) {
				return room;
			}

			//We didn't get a room, let's try finding direct messages
			room = RocketChat.getRoomByNameOrIdWithOptionToJoin({ currentUserId, nameOrId, type: 'd', tryDirectByUserIdOnly: true });
			if (room) {
				return room;
			}

			if (historyId) {
				RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'identifying-room', error: true });
			}

			//No room, so throw an error
			throw new Meteor.Error('invalid-channel');
	}

};

this.processWebhookMessage = function(messageObj, user, defaultValues = { channel: '', alias: '', avatar: '', emoji: '' }, mustBeJoined = false, isIncoming = true, historyId = null) {
	const sentData = [];
	const channels = [].concat(messageObj.channel || messageObj.roomId || defaultValues.channel);

	for (const channel of channels) {
		const channelType = channel[0];

		let channelValue = channel.substr(1);

		if (historyId) {
			RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'identifying-room' });
		}

		const room = getRoom(channelType, user._id, channelValue, historyId, isIncoming);
		if (channelType !== '#' && channelType !== '@') {
			channelValue = channelType + channelValue;
		}

		if (mustBeJoined && !room.usernames.includes(user.username)) {
			if (historyId) {
				RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'check-if-user-joined-room', error: true });
			}

			// throw new Meteor.Error('invalid-room', 'Invalid room provided to send a message to, must be joined.');
			throw new Meteor.Error('invalid-channel'); // Throwing the generic one so people can't "brute force" find rooms
		}

		if (messageObj.attachments && !_.isArray(messageObj.attachments)) {
			console.log('Attachments should be Array, ignoring value'.red, messageObj.attachments);
			messageObj.attachments = undefined;
		}

		const message = {
			alias: messageObj.username || messageObj.alias || defaultValues.alias,
			msg: s.trim(messageObj.text || messageObj.msg || ''),
			attachments: messageObj.attachments || [],
			parseUrls: messageObj.parseUrls !== undefined ? messageObj.parseUrls : !messageObj.attachments,
			bot: messageObj.bot,
			groupable: (messageObj.groupable !== undefined) ? messageObj.groupable : false
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

		if (historyId) {
			RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'send-message' });
		}

		const messageReturn = RocketChat.sendMessage(user, message, room);
		sentData.push({ channel, message: messageReturn });
	}

	return sentData;
};
