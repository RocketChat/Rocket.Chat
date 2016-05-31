/* globals logger */

class SlackBridge {
	constructor() {
		this.slackClient = Npm.require('slack-client');
		this.apiToken = RocketChat.settings.get('SlackBridge_APIToken');
		this.rtm = {};
		this.connected = false;
		this.userTags = {};

		RocketChat.settings.onload('SlackBridge_APIToken', (key, value) => {
			this.apiToken = value;
		});

		RocketChat.settings.onload('SlackBridge_Enabled', (key, value) => {
			if (value) {
				this.connect();
			} else {
				this.disconnect();
			}
		});
	}

	connect() {
		if (!this.connected) {
			this.connected = true;
			logger.connection.info('Connecting via token: ', this.apiToken);
			var RtmClient = this.slackClient.RtmClient;
			this.rtm = new RtmClient(this.apiToken);
			this.rtm.start();
			this.setEvents();
		}
	}

	disconnect() {
		this.rtm.disconnect && this.rtm.disconnect();
		this.connected = false;
		logger.connection.info('Disconnected');
	}

	convertSlackMessageToRocketChat(message) {
		if (!_.isEmpty(message)) {
			message = message.replace(/<!everyone>/g, '@all');
			message = message.replace(/<!channel>/g, '@all');
			message = message.replace(/&gt;/g, '<');
			message = message.replace(/&lt;/g, '>');
			message = message.replace(/&amp;/g, '&');
			message = message.replace(/:simple_smile:/g, ':smile:');
			message = message.replace(/:memo:/g, ':pencil:');
			message = message.replace(/:piggy:/g, ':pig:');
			message = message.replace(/:uk:/g, ':gb:');
			message = message.replace(/<(http[s]?:[^>]*)>/g, '$1');

			message.replace(/(?:<@)([a-zA-Z0-9]+)(?:>)/g, (match, userId) => {
				if (!this.userTags[userId]) {
					this.findUser(userId) || this.addUser(userId); // This adds userTags for the userId
				}
				let userTags = this.userTags[userId];
				if (userTags) {
					message = message.replace(userTags.slack, userTags.rocket);
				}
			});
		} else {
			message = '';
		}
		return message;
	}

	findChannel(channelId) {
		return RocketChat.models.Rooms.findOneByImportId(channelId);
	}

	addChannel(channelId) {
		let data = HTTP.get('https://slack.com/api/channels.info', { params: { token: this.apiToken, channel: channelId } });
		if (data && data.data && data.data.ok === true) {
			let channelData = data.data.channel;
			let existingRoom = RocketChat.models.Rooms.findOneByName(channelData.name);
			if (existingRoom || channelData.is_general) {
				if (channelData.is_general && channelData.name !== (existingRoom && existingRoom.name)) {
					Meteor.call('saveRoomSettings', 'GENERAL', 'roomName', channelData.name);
				}
				channelData.rocketId = channelData.is_general ? 'GENERAL' : existingRoom._id;
				RocketChat.models.Rooms.update({ _id: channelData.rocketId }, { $addToSet: { importIds: channelData.id } });
			} else {
				let users = [];
				for (let member of channelData.members) {
					if (member !== channelData.creator) {
						let user = this.findUser(member) || this.addUser(member);
						if (user) {
							users.push(user.username);
						}
					}
				}
				let creator = this.findUser(channelData.creator) || this.addUser(channelData.creator);
				if (!creator) {
					logger.events.error('Could not fetch room creator information', channelData.creator);
					return;
				}

				Meteor.runAsUser(creator._id, () => {
					let channel = Meteor.call('createChannel', channelData.name, users);
					channelData.rocketId = channel._id;
				});

				let roomUpdate = {
					ts: new Date(channelData.created * 1000)
				};
				let lastSetTopic = 0;
				if (!_.isEmpty(channelData.topic && channelData.topic.value)) {
					roomUpdate.topic = channelData.topic.value;
					lastSetTopic = channelData.topic.last_set;
				}
				if (!_.isEmpty(channelData.purpose && channelData.purpose.value) && channelData.purpose.last_set > lastSetTopic) {
					roomUpdate.topic = channelData.purpose.value;
				}
				RocketChat.models.Rooms.update({ _id: channelData.rocketId }, { $set: roomUpdate, $addToSet: { importIds: channelData.id } });
			}
			return RocketChat.models.Rooms.findOne(channelData.rocketId);
		}

		return;
	}

	findUser(userId) {
		let user = RocketChat.models.Users.findOneByImportId(userId);
		if (user && !this.userTags[userId]) {
			this.userTags[userId] = { slack: `<@${userId}>`, rocket: `@${user.username}` };
		}
		return user;
	}

	addUser(userId) {
		let data = HTTP.get('https://slack.com/api/users.info', { params: { token: this.apiToken, user: userId } });
		if (data && data.data && data.data.ok === true && data.data.user && data.data.user.profile && data.data.user.profile.email) {
			let userData = data.data.user;
			let existingUser = RocketChat.models.Users.findOneByEmailAddress(userData.profile.email) || RocketChat.models.Users.findOneByUsername(userData.name);
			if (existingUser) {
				userData.rocketId = existingUser._id;
				userData.name = existingUser.username;
			} else {
				userData.rocketId = Accounts.createUser({ email: userData.profile.email, password: Date.now() + userData.name + userData.profile.email.toUpperCase() });
				Meteor.runAsUser(userData.rocketId, () => {
					Meteor.call('setUsername', userData.name);
					Meteor.call('joinDefaultChannels', true);
					let url = null;
					if (userData.profile.image_original) {
						url = userData.profile.image_original;
					} else if (userData.profile.image_512) {
						url = userData.profile.image_512;
					}
					Meteor.call('setAvatarFromService', url, null, 'url');
					// Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600
					if (userData.tz_offset) {
						Meteor.call('updateUserUtcOffset', userData.tz_offset / 3600);
					}
					if (userData.profile.real_name) {
						RocketChat.models.Users.setName(userData.rocketId, userData.profile.real_name);
						// Deleted users are 'inactive' users in Rocket.Chat
						if (userData.deleted) {
							Meteor.call('setUserActiveStatus', userData.rocketId, false);
						}
					}
				});
			}
			RocketChat.models.Users.update({ _id: userData.rocketId }, { $addToSet: { importIds: userData.id } });
			if (!this.userTags[userId]) {
				this.userTags[userId] = { slack: `<@${userId}>`, rocket: `@${userData.name}` };
			}
			return RocketChat.models.Users.findOneById(userData.rocketId);
		}

		return;
	}

	saveMessage(room, user, message) {
		let msgDataDefaults = {
			_id: `${message.channel}S${message.ts}`,
			ts: new Date(parseInt(message.ts.split('.')[0]) * 1000)
		};
		if (message.type === 'message') {
			let msgObj = {};
			if (!_.isEmpty(message.subtype)) {
				switch (message.subtype) {
					case 'channel_join':
						return this.joinRoom(room, user);
					case 'channel_leave':
						return this.leaveRoom(room, user);
					case 'me_message':
						msgObj = {
							msg: `_${this.convertSlackMessageToRocketChat(message.text)}_`
						};
						break;
					case 'bot_message':
						break;
					case 'channel_purpose':
						return RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, message.purpose, user, msgDataDefaults);
					case 'channel_topic':
						return RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, message.topic, user, msgDataDefaults);
					case 'pinned_item':
						if (message.attachments) {
							msgObj = {
								attachments: [
									{
										'text' : this.convertSlackMessageToRocketChat(message.attachments[0].text),
										'author_name' : message.attachments[0].author_subname,
										'author_icon' : getAvatarUrlFromUsername(message.attachments[0].author_subname)
									}
								]
							};
							_.extend(msgObj, msgDataDefaults);
							return RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('message_pinned', room._id, '', user, msgObj);
						} else {
							logger.event.error('Pinned item with no attachment');
							return;
						}
					case 'file_share':
						if (message.file && message.file.url_private_download !== undefined) {
							let details = {
								message_id: `S${message.ts}`,
								name: message.file.name,
								size: message.file.size,
								type: message.file.mimetype,
								rid: room._id
							};
							return this.uploadFile(details, message.file.url_private_download, user, room, new Date(parseInt(message.ts.split('.')[0]) * 1000));
						}
						break;
				}
			} else {
				msgObj = {
					msg: this.convertSlackMessageToRocketChat(message.text),
					rid: room._id,
					u: {
						_id: user._id,
						username: user.username
					}
				};
			}
			_.extend(msgObj, msgDataDefaults);
			if (message.edited) {
				msgObj.ets = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
			}
			RocketChat.sendMessage(user, msgObj, room, { upsert: true });
		}
	}

	joinRoom(room, user) {
		Meteor.runAsUser(user._id, () => {
			return Meteor.call('joinRoom', room._id);
		});
	}

	leaveRoom(room, user) {
		Meteor.runAsUser(user._id, () => {
			return Meteor.call('leaveRoom', room._id);
		});
	}

	/**
	Uploads the file to the storage.
	@param [Object] details an object with details about the upload. name, size, type, and rid
	@param [String] fileUrl url of the file to download/import
	@param [Object] user the Rocket.Chat user
	@param [Object] room the Rocket.Chat room
	@param [Date] timeStamp the timestamp the file was uploaded
	**/
	uploadFile(details, fileUrl, user, room, timeStamp) {
		HTTP.get(fileUrl, Meteor.bindEnvironment((stream) => {
			let fileId = Meteor.fileStore.create(details);
			if (fileId) {
				Meteor.fileStore.write(stream, fileId, (err, file) => {
					if (err) {
						throw new Error(err);
					} else {
						let url = file.url.replace(Meteor.absoluteUrl(), '/');
						let attachment = {
							title: `File Uploaded: ${file.name}`,
							title_link: url
						};

						if (/^image\/.+/.test(file.type)) {
							attachment.image_url = url;
							attachment.image_type = file.type;
							attachment.image_size = file.size;
							attachment.image_dimensions = file.identify && file.identify.size;
						}
						if (/^audio\/.+/.test(file.type)) {
							attachment.audio_url = url;
							attachment.audio_type = file.type;
							attachment.audio_size = file.size;
						}
						if (/^video\/.+/.test(file.type)) {
							attachment.video_url = url;
							attachment.video_type = file.type;
							attachment.video_size = file.size;
						}

						let msg = {
							rid: details.rid,
							ts: timeStamp,
							msg: '',
							file: {
								_id: file._id
							},
							groupable: false,
							attachments: [attachment]
						};

						if (details.message_id && (typeof details.message_id === 'string')) {
							msg['_id'] = details.message_id;
						}

						return RocketChat.sendMessage(user, msg, room);
					}
				});
			}
		}));
	}

	setEvents() {
		var CLIENT_EVENTS = this.slackClient.CLIENT_EVENTS;
		this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, () => {
			logger.connection.info('Connected');
		});

		this.rtm.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, () => {
			this.disconnect();
		});

		this.rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, () => {
			this.disconnect();
		});

		var RTM_EVENTS = this.slackClient.RTM_EVENTS;

		this.rtm.on(RTM_EVENTS.MESSAGE, Meteor.bindEnvironment((message) => {
			logger.events.info('MESSAGE: ', message);
			if (message && message.channel && message.user) {
				let channel = this.findChannel(message.channel) || this.addChannel(message.channel);
				let user = this.findUser(message.user) || this.addUser(message.user);
				if (channel && user) {
					this.saveMessage(channel, user, message);
				}
			}
		}));

		this.rtm.on(RTM_EVENTS.CHANNEL_CREATED, Meteor.bindEnvironment((message) => {
			logger.events.info('CHANNEL CREATED: ', message);
		}));

		this.rtm.on(RTM_EVENTS.CHANNEL_JOINED, Meteor.bindEnvironment((message) => {
			logger.events.info('CHANNEL JOINED: ', message);
		}));

		this.rtm.on(RTM_EVENTS.CHANNEL_LEFT, Meteor.bindEnvironment((message) => {
			logger.events.info('CHANNEL LEFT: ', message);
		}));

		this.rtm.on(RTM_EVENTS.CHANNEL_DELETED, Meteor.bindEnvironment((message) => {
			logger.events.info('CHANNEL DELETED: ', message);
		}));

		this.rtm.on(RTM_EVENTS.CHANNEL_RENAME, Meteor.bindEnvironment((message) => {
			logger.events.info('CHANNEL RENAME: ', message);
		}));

		this.rtm.on(RTM_EVENTS.IM_CREATED, Meteor.bindEnvironment((message) => {
			logger.events.info('IM CREATED: ', message);
		}));

		this.rtm.on(RTM_EVENTS.IM_OPEN, Meteor.bindEnvironment((message) => {
			logger.events.info('IM OPEN: ', message);
		}));

		this.rtm.on(RTM_EVENTS.IM_CLOSE, Meteor.bindEnvironment((message) => {
			logger.events.info('IM CLOSE: ', message);
		}));

		this.rtm.on(RTM_EVENTS.GROUP_JOINED, Meteor.bindEnvironment((message) => {
			logger.events.info('GROUP JOINED: ', message);
		}));

		this.rtm.on(RTM_EVENTS.GROUP_LEFT, Meteor.bindEnvironment((message) => {
			logger.events.info('GROUP LEFT: ', message);
		}));

		this.rtm.on(RTM_EVENTS.GROUP_OPEN, Meteor.bindEnvironment((message) => {
			logger.events.info('GROUP OPEN: ', message);
		}));

		this.rtm.on(RTM_EVENTS.GROUP_CLOSE, Meteor.bindEnvironment((message) => {
			logger.events.info('GROUP CLOSE: ', message);
		}));

		this.rtm.on(RTM_EVENTS.GROUP_RENAME, Meteor.bindEnvironment((message) => {
			logger.events.info('GROUP RENAME: ', message);
		}));

		this.rtm.on(RTM_EVENTS.TEAM_JOIN, Meteor.bindEnvironment((message) => {
			logger.events.info('TEAM JOIN: ', message);
		}));
	}
}

RocketChat.SlackBridge = new SlackBridge;
