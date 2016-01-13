this.processWebhookMessage = function(integration, messageObj, user) {
	var attachment, channel, channelType, i, len, message, ref, rid, room, roomUser;

	channel = messageObj.channel || integration.channel;

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
				return {
					statusCode: 400,
					body: {
						success: false,
						error: 'invalid-channel'
					}
				};
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
			});
			if (roomUser == null) {
				return {
					statusCode: 400,
					body: {
						success: false,
						error: 'invalid-channel'
					}
				};
			}
			rid = [user._id, roomUser._id].sort().join('');
			room = RocketChat.models.Rooms.findOne(rid);
			if (!room) {
				Meteor.runAsUser(user._id, function() {
					Meteor.call('createDirectMessage', roomUser.username);
					return room = RocketChat.models.Rooms.findOne(rid);
				});
			}
			break;
		default:
			return {
				statusCode: 400,
				body: {
					success: false,
					error: 'invalid-channel-type'
				}
			};
	}

	message = {
		alias: messageObj.username || messageObj.alias || integration.alias,
		msg: _.trim(messageObj.text || messageObj.msg || ''),
		attachments: messageObj.attachments,
		parseUrls: false,
		bot: {
			i: integration._id
		},
		groupable: false
	};

	if ((messageObj.icon_url != null) || (messageObj.avatar != null)) {
		message.avatar = messageObj.icon_url || messageObj.avatar;
	} else if ((messageObj.icon_emoji != null) || (messageObj.emoji != null)) {
		message.emoji = messageObj.icon_emoji || messageObj.emoji;
	} else if (integration.avatar != null) {
		message.avatar = integration.avatar;
	} else if (integration.emoji != null) {
		message.emoji = integration.emoji;
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

	RocketChat.sendMessage(user, message, room, {});

	return {
		statusCode: 200,
		body: {
			success: true
		}
	};
};
