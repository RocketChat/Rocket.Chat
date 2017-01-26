function retrieveRoomInfo({ currentUserId, channel, ignoreEmpty=false }) {
	const room = RocketChat.models.Rooms.findOneByIdOrName(channel);
	if (!_.isObject(room) && !ignoreEmpty) {
		throw new Meteor.Error('invalid-channel');
	}

	if (room && room.t === 'c') {
		//Check if the user already has a Subscription or not, this avoids this issue: https://github.com/RocketChat/Rocket.Chat/issues/5477
		const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, currentUserId);

		if (!sub) {
			Meteor.runAsUser(currentUserId, function() {
				return Meteor.call('joinRoom', room._id);
			});
		}
	}

	return room;
}

function retrieveDirectMessageInfo({ currentUserId, channel, findByUserIdOnly=false }) {
	let roomUser = undefined;

	if (findByUserIdOnly) {
		roomUser = RocketChat.models.Users.findOneById(channel);
	} else {
		roomUser = RocketChat.models.Users.findOne({
			$or: [{ _id: channel }, { username: channel }]
		});
	}

	const rid = _.isObject(roomUser) ? [currentUserId, roomUser._id].sort().join('') : channel;
	let room = RocketChat.models.Rooms.findOneById(rid);

	if (!_.isObject(room)) {
		if (!_.isObject(roomUser)) {
			throw new Meteor.Error('invalid-channel');
		}

		room = Meteor.runAsUser(currentUserId, function() {
			const {rid} = Meteor.call('createDirectMessage', roomUser.username);
			return RocketChat.models.Rooms.findOneById(rid);
		});
	}

	return room;
}

this.processWebhookMessage = function(messageObj, user, defaultValues) {
	var attachment, channel, channels, channelType, i, len, message, ref, room, ret;
	ret = [];

	if (!defaultValues) {
		defaultValues = {
			channel: '',
			alias: '',
			avatar: '',
			emoji: ''
		};
	}

	channel = messageObj.channel || messageObj.roomId || defaultValues.channel;

	channels = [].concat(channel);

	for (channel of channels) {
		channelType = channel[0];

		channel = channel.substr(1);

		switch (channelType) {
			case '#':
				room = retrieveRoomInfo({ currentUserId: user._id, channel });
				break;
			case '@':
				room = retrieveDirectMessageInfo({ currentUserId: user._id, channel });
				break;
			default:
				channel = channelType + channel;

				//Try to find the room by id or name if they didn't include the prefix.
				room = retrieveRoomInfo({ currentUserId: user._id, channel, ignoreEmpty: true });
				if (room) {
					break;
				}

				//We didn't get a room, let's try finding direct messages
				room = retrieveDirectMessageInfo({ currentUserId: user._id, channel, findByUserIdOnly: true });
				if (room) {
					break;
				}

				//No room, so throw an error
				throw new Meteor.Error('invalid-channel');
		}

		if (messageObj.attachments && !_.isArray(messageObj.attachments)) {
			console.log('Attachments should be Array, ignoring value'.red, messageObj.attachments);
			messageObj.attachments = undefined;
		}

		message = {
			alias: messageObj.username || messageObj.alias || defaultValues.alias,
			msg: _.trim(messageObj.text || messageObj.msg || ''),
			attachments: messageObj.attachments,
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
			ref = message.attachments;
			for (i = 0, len = ref.length; i < len; i++) {
				attachment = ref[i];
				if (attachment.msg) {
					attachment.text = _.trim(attachment.msg);
					delete attachment.msg;
				}
			}
		}

		var messageReturn = RocketChat.sendMessage(user, message, room);
		ret.push({ channel: channel, message: messageReturn });
	}
	return ret;
};
