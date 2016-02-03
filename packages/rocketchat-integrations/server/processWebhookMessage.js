this.processWebhookMessage = function(messageObj, user, defaultValues) {
	var attachment, channel, channelType, i, len, message, ref, rid, room, roomUser;

	if (!defaultValues) {
		defaultValues = {
			channel: '',
			alias: '',
			avatar: '',
			emoji: ''
		};
	}

	channel = messageObj.channel || defaultValues.channel;

	channelType = channel[0];

	channel = channel.substr(1);

	switch (channelType) {
		case '#':
			room = RocketChat.models.Rooms.findOne({
				$or: [
					{
						_id: channel
					}, {
						name: channel
					}
				]
			});
			if (room == null) {
				throw new Meteor.Error('invalid-channel');
			}
			rid = room._id;
			if (room.t === 'c') {
				Meteor.runAsUser(user._id, function() {
					return Meteor.call('joinRoom', room._id);
				});
			}
			break;
		case '@':
			roomUser = RocketChat.models.Users.findOne({
				$or: [
					{
						_id: channel
					}, {
						username: channel
					}
				]
			}) || {};
			rid = [user._id, roomUser._id].sort().join('');
			room = RocketChat.models.Rooms.findOne({
				_id: {
					$in: [rid, channel]
				}
			});
			if (roomUser == null && room == null) {
				throw new Meteor.Error('invalid-channel');
			}
			if (!room) {
				Meteor.runAsUser(user._id, function() {
					Meteor.call('createDirectMessage', roomUser.username);
					return room = RocketChat.models.Rooms.findOne(rid);
				});
			}
			break;
		default:
			throw new Meteor.Error('invalid-channel-type');
	}

	message = {
		alias: messageObj.username || messageObj.alias || defaultValues.alias,
		msg: _.trim(messageObj.text || messageObj.msg || ''),
		attachments: messageObj.attachments,
		parseUrls: false,
		bot: messageObj.bot,
		groupable: false
	};

	if ((messageObj.icon_url != null) || (messageObj.avatar != null)) {
		message.avatar = messageObj.icon_url || messageObj.avatar;
	} else if ((messageObj.icon_emoji != null) || (messageObj.emoji != null)) {
		message.emoji = messageObj.icon_emoji || messageObj.emoji;
	} else if (defaultValues.avatar != null) {
		message.avatar = defaultValues.avatar;
	} else if (defaultValues.emoji != null) {
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

	var messageReturn = RocketChat.sendMessage(user, message, room, {});

	return {
		channel: channel,
		message: messageReturn
	}
};
