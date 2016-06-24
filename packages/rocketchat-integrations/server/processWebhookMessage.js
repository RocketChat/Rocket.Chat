this.processWebhookMessage = function(messageObj, user, defaultValues) {
	var attachment, channel, channels, channelType, i, len, message, ref, rid, room, roomUser, ret;
	ret = [];

	if (!defaultValues) {
		defaultValues = {
			channel: '',
			alias: '',
			avatar: '',
			emoji: ''
		};
	}

	channel = messageObj.channel || defaultValues.channel;

	channels = [].concat(channel);

	for (channel of channels) {
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
				if (!_.isObject(room)) {
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
				if (!_.isObject(roomUser) && !_.isObject(room)) {
					throw new Meteor.Error('invalid-channel');
				}
				if (!room) {
					Meteor.runAsUser(user._id, function() {
						Meteor.call('createDirectMessage', roomUser.username);
						room = RocketChat.models.Rooms.findOne(rid);
					});
				}
				break;
			default:
				throw new Meteor.Error('invalid-channel-type');
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
			groupable: false
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
