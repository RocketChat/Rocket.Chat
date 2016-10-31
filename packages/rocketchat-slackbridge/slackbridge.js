/* globals logger */

class SlackBridge {
	constructor() {
		this.util = Npm.require('util');
		this.slackClient = Npm.require('slack-client');
		this.apiToken = RocketChat.settings.get('SlackBridge_APIToken');
		this.aliasFormat = RocketChat.settings.get('SlackBridge_AliasFormat');
		this.excludeBotnames = RocketChat.settings.get('SlackBridge_Botnames');
		this.rtm = {};
		this.connected = false;
		this.userTags = {};
		this.channelMap = {};

		RocketChat.settings.get('SlackBridge_APIToken', (key, value) => {
			this.apiToken = value;
			if (this.connected) {
				this.disconnect();
				this.connect();
			} else if (RocketChat.settings.get('SlackBridge_Enabled')) {
				this.connect();
			}
		});

		RocketChat.settings.get('SlackBridge_Enabled', (key, value) => {
			if (value && this.apiToken) {
				this.connect();
			} else {
				this.disconnect();
			}
		});

		RocketChat.settings.get('SlackBridge_AliasFormat', (key, value) => {
			this.aliasFormat = value;
		});

		RocketChat.settings.get('SlackBridge_ExcludeBotnames', (key, value) => {
			this.excludeBotnames = value;
		});
	}

	connect() {
		if (this.connected === false) {
			this.connected = true;
			logger.connection.info('Connecting via token: ', this.apiToken);
			var RtmClient = this.slackClient.RtmClient;
			this.rtm = new RtmClient(this.apiToken);
			this.rtm.start();
			this.setEvents();
			RocketChat.settings.get('SlackBridge_Out_Enabled', (key, value) => {
				if (value) {
					RocketChat.callbacks.add('afterSaveMessage', this.slackBridgeOut.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_Out');
				} else {
					RocketChat.callbacks.remove('afterSaveMessage', 'SlackBridge_Out');
				}
			});
			Meteor.startup(() => {
				this.populateChannelMap(); // If run outside of Meteor.startup, HTTP is not defined
			});
		}
	}

	disconnect() {
		if (this.connected === true) {
			this.connected = false;
			this.rtm.disconnect && this.rtm.disconnect();
			logger.connection.info('Disconnected');
			RocketChat.callbacks.remove('afterSaveMessage', 'SlackBridge_Out');
		}
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

			message.replace(/(?:<@)([a-zA-Z0-9]+)(?:\|.+)?(?:>)/g, (match, userId) => {
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
		logger.class.debug('Searching for Rocket.Chat channel', channelId);
		return RocketChat.models.Rooms.findOneByImportId(channelId);
	}

	addChannel(channelId, hasRetried = false) {
		logger.class.debug('Adding channel from Slack', channelId);
		let data = null;
		let isGroup = false;
		if (channelId.charAt(0) === 'C') {
			data = HTTP.get('https://slack.com/api/channels.info', { params: { token: this.apiToken, channel: channelId } });
		} else if (channelId.charAt(0) === 'G') {
			data = HTTP.get('https://slack.com/api/groups.info', { params: { token: this.apiToken, channel: channelId } });
			isGroup = true;
		}
		if (data && data.data && data.data.ok === true) {
			let channelData = isGroup ? data.data.group : data.data.channel;
			let existingRoom = RocketChat.models.Rooms.findOneByName(channelData.name);

			// If the room exists, make sure we have its id in importIds
			if (existingRoom || channelData.is_general) {
				channelData.rocketId = channelData.is_general ? 'GENERAL' : existingRoom._id;
				RocketChat.models.Rooms.update({ _id: channelData.rocketId }, { $addToSet: { importIds: channelData.id } });
			} else {
				let users = [];
				for (let member of channelData.members) {
					if (member !== channelData.creator) {
						let user = this.findUser(member) || this.addUser(member);
						if (user && user.username) {
							users.push(user.username);
						}
					}
				}
				let creator = channelData.creator ? this.findUser(channelData.creator) || this.addUser(channelData.creator) : null;
				if (!creator) {
					logger.class.error('Could not fetch room creator information', channelData.creator);
					return;
				}

				try {
					let channel = RocketChat.createRoom(isGroup ? 'p' : 'c', channelData.name, creator.username, users);
					channelData.rocketId = channel.rid;
				} catch (e) {
					if (!hasRetried) {
						logger.class.debug('Error adding channel from Slack. Will retry in 1s.', e.message);
						// If first time trying to create channel fails, could be because of multiple messages received at the same time. Try again once after 1s.
						Meteor._sleepForMs(1000);
						return this.findChannel(channelId) || this.addChannel(channelId, true);
					} else {
						console.log(e.message);
					}
				}

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
				this.channelMap[channelData.rocketId] = { id: channelId, family: channelId.charAt(0) === 'C' ? 'channels' : 'groups' };
			}
			return RocketChat.models.Rooms.findOneById(channelData.rocketId);
		}

		return;
	}

	findUser(userId) {
		logger.class.debug('Searching for Rocket.Chat user', userId);
		let user = RocketChat.models.Users.findOneByImportId(userId);
		if (user && !this.userTags[userId]) {
			this.userTags[userId] = { slack: `<@${userId}>`, rocket: `@${user.username}` };
		}
		return user;
	}

	addUser(userId) {
		logger.class.debug('Adding user from Slack', userId);
		let data = HTTP.get('https://slack.com/api/users.info', { params: { token: this.apiToken, user: userId } });
		if (data && data.data && data.data.ok === true && data.data.user) {
			let userData = data.data.user;
			let isBot = userData.is_bot === true;
			let email = userData.profile && userData.profile.email || '';
			let existingUser;
			if (!isBot) {
				existingUser = RocketChat.models.Users.findOneByEmailAddress(email) || RocketChat.models.Users.findOneByUsername(userData.name);
			} else {
				existingUser = RocketChat.models.Users.findOneByUsername(userData.name);
			}

			if (existingUser) {
				userData.rocketId = existingUser._id;
				userData.name = existingUser.username;
			} else {
				let newUser = { password: Random.id() };
				if (isBot || !email) {
					newUser.username = userData.name;
				} else {
					newUser.email = email;
				}
				userData.rocketId = Accounts.createUser(newUser);
				let userUpdate = {
					username: userData.name,
					utcOffset: userData.tz_offset / 3600, // Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600,
					roles: isBot ? [ 'bot' ] : [ 'user' ]
				};

				if (userData.profile && userData.profile.real_name) {
					userUpdate['name'] = userData.profile.real_name;
				}

				if (userData.deleted) {
					userUpdate['active'] = false;
					userUpdate['services.resume.loginTokens'] = [];
				}

				RocketChat.models.Users.update({ _id: userData.rocketId }, { $set: userUpdate });

				let user = RocketChat.models.Users.findOneById(userData.rocketId);

				let url = null;
				if (userData.profile) {
					if (userData.profile.image_original) {
						url = userData.profile.image_original;
					} else if (userData.profile.image_512) {
						url = userData.profile.image_512;
					}
				}
				if (url) {
					try {
						RocketChat.setUserAvatar(user, url, null, 'url');
					} catch (error) {
						logger.class.debug('Error setting user avatar', error.message);
					}
				}
				RocketChat.addUserToDefaultChannels(user, true);
			}

			let importIds = [ userData.id ];
			if (isBot && userData.profile && userData.profile.bot_id) {
				importIds.push(userData.profile.bot_id);
			}
			RocketChat.models.Users.update({ _id: userData.rocketId }, { $addToSet: { importIds: { $each: importIds } } });
			if (!this.userTags[userId]) {
				this.userTags[userId] = { slack: `<@${userId}>`, rocket: `@${userData.name}` };
			}
			logger.class.debug('User: ', userData.rocketId);
			return RocketChat.models.Users.findOneById(userData.rocketId);
		}
		logger.class.debug('User not added');
		return;
	}

	addAlias(username, msgObj) {
		if (this.aliasFormat) {
			var alias = this.util.format(this.aliasFormat, username);

			if (alias !== username) {
				msgObj.alias = alias;
			}
		}

		return msgObj;
	}

	sendMessage(room, user, message, msgDataDefaults, importing) {
		if (message.type === 'message') {
			let msgObj = {};
			if (!_.isEmpty(message.subtype)) {
				msgObj = this.processSubtypedMessage(room, user, message, importing);
				if (!msgObj) {
					return;
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

				this.addAlias(user.username, msgObj);
			}
			_.extend(msgObj, msgDataDefaults);
			if (message.edited) {
				msgObj.ets = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
			}
			if (message.subtype === 'bot_message') {
				user = RocketChat.models.Users.findOneById('rocket.cat', { fields: { username: 1 } });
			}

			if (message.pinned_to && message.pinned_to.indexOf(message.channel) !== -1) {
				msgObj.pinned = true;
				msgObj.pinnedAt = Date.now;
				msgObj.pinnedBy = _.pick(user, '_id', 'username');
			}
			RocketChat.sendMessage(user, msgObj, room, true);
		}
	}

	saveMessage(message, importing) {
		let channel = message.channel ? this.findChannel(message.channel) || this.addChannel(message.channel) : null;
		let user = null;
		if (message.subtype === 'message_deleted' || message.subtype === 'message_changed') {
			user = message.previous_message.user ? this.findUser(message.previous_message.user) || this.addUser(message.previous_message.user) : null;
		} else if (message.subtype === 'bot_message') {
			user = RocketChat.models.Users.findOneById('rocket.cat', { fields: { username: 1 } });
		} else {
			user = message.user ? this.findUser(message.user) || this.addUser(message.user) : null;
		}
		if (channel && user) {
			let msgDataDefaults = {
				_id: `slack-${message.channel}-${message.ts.replace(/\./g, '-')}`,
				ts: new Date(parseInt(message.ts.split('.')[0]) * 1000)
			};
			if (importing) {
				msgDataDefaults['imported'] = 'slackbridge';
			}
			try {
				this.sendMessage(channel, user, message, msgDataDefaults, importing);
			} catch (e) {
				// http://www.mongodb.org/about/contributors/error-codes/
				// 11000 == duplicate key error
				if (e.name === 'MongoError' && e.code === 11000) {
					return;
				}

				throw e;
			}
		}
	}

	processSubtypedMessage(room, user, message, importing) {
		let msgObj = null;
		switch (message.subtype) {
			case 'bot_message':
				if (message.username !== undefined && this.excludeBotnames && message.username.match(this.excludeBotnames)) {
					return;
				}

				msgObj = {
					msg: this.convertSlackMessageToRocketChat(message.text),
					rid: room._id,
					bot: true,
					attachments: message.attachments,
					username: message.username || message.bot_id
				};
				this.addAlias(message.username || message.bot_id, msgObj);
				if (message.icons) {
					msgObj.emoji = message.icons.emoji;
				}
				return msgObj;
			case 'me_message':
				return this.addAlias(user.username, {
					msg: `_${this.convertSlackMessageToRocketChat(message.text)}_`
				});
			case 'message_changed':
				this.editMessage(room, user, message);
				return;
			case 'message_deleted':
				if (message.previous_message) {
					let _id = `slack-${message.channel}-${message.previous_message.ts.replace(/\./g, '-')}`;
					msgObj = RocketChat.models.Messages.findOneById(_id);
					if (msgObj) {
						RocketChat.deleteMessage(msgObj, user);
					}
				}
				return;
			case 'channel_join':
				if (importing) {
					RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(room._id, user, { ts: new Date(parseInt(message.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
				} else {
					RocketChat.addUserToRoom(room._id, user);
				}
				return;
			case 'group_join':
				if (message.inviter) {
					let inviter = message.inviter ? this.findUser(message.inviter) || this.addUser(message.inviter) : null;
					if (importing) {
						RocketChat.models.Messages.createUserAddedWithRoomIdAndUser(room._id, user, {
							ts: new Date(parseInt(message.ts.split('.')[0]) * 1000),
							u: {
								_id: inviter._id,
								username: inviter.username
							},
							imported: 'slackbridge'
						});
					} else {
						RocketChat.addUserToRoom(room._id, user, inviter);
					}
				}
				return;
			case 'channel_leave':
			case 'group_leave':
				if (importing) {
					RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(room._id, user, {
						ts: new Date(parseInt(message.ts.split('.')[0]) * 1000),
						imported: 'slackbridge'
					});
				} else {
					RocketChat.removeUserFromRoom(room._id, user);
				}
				return;
			case 'channel_topic':
			case 'group_topic':
				if (importing) {
					RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, message.topic, user, { ts: new Date(parseInt(message.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
				} else {
					RocketChat.saveRoomTopic(room._id, message.topic, user, false);
				}
				return;
			case 'channel_purpose':
			case 'group_purpose':
				if (importing) {
					RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, message.purpose, user, { ts: new Date(parseInt(message.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
				} else {
					RocketChat.saveRoomTopic(room._id, message.purpose, user, false);
				}
				return;
			case 'channel_name':
			case 'group_name':
				if (importing) {
					RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(room._id, message.name, user, { ts: new Date(parseInt(message.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
				} else {
					RocketChat.saveRoomName(room._id, message.name, user, false);
				}
				return;
			case 'channel_archive':
			case 'group_archive':
				if (!importing) {
					RocketChat.archiveRoom(room);
				}
				return;
			case 'channel_unarchive':
			case 'group_unarchive':
				if (!importing) {
					RocketChat.unarchiveRoom(room);
				}
				return;
			case 'file_share':
				if (message.file && message.file.url_private_download !== undefined) {
					let details = {
						message_id: `slack-${message.ts.replace(/\./g, '-')}`,
						name: message.file.name,
						size: message.file.size,
						type: message.file.mimetype,
						rid: room._id
					};
					return this.uploadFile(details, message.file.url_private_download, user, room, new Date(parseInt(message.ts.split('.')[0]) * 1000), importing);
				}
				break;
			case 'file_comment':
				logger.class.error('File comment not implemented');
				return;
			case 'file_mention':
				logger.class.error('File mentioned not implemented');
				return;
			case 'pinned_item':
				if (message.attachments && message.attachments[0] && message.attachments[0].text) {
					msgObj = {
						rid: room._id,
						t: 'message_pinned',
						msg: '',
						u: {
							_id: user._id,
							username: user.username
						},
						attachments: [{
							'text' : this.convertSlackMessageToRocketChat(message.attachments[0].text),
							'author_name' : message.attachments[0].author_subname,
							'author_icon' : getAvatarUrlFromUsername(message.attachments[0].author_subname),
							'ts' : new Date(parseInt(message.attachments[0].ts.split('.')[0]) * 1000)
						}]
					};

					if (!importing) {
						RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${message.attachments[0].channel_id}-${message.attachments[0].ts.replace(/\./g, '-')}`, msgObj.u, true, new Date(parseInt(message.ts.split('.')[0]) * 1000));
					}

					return msgObj;
				} else {
					logger.class.error('Pinned item with no attachment');
				}
				return;
			case 'unpinned_item':
				logger.class.error('Unpinned item not implemented');
				return;
		}
	}

	/**
	* Edits a message
	**/
	editMessage(room, user, message) {
		let msgObj = {
			//@TODO _id
			_id: `slack-${message.channel}-${message.message.ts.replace(/\./g, '-')}`,
			rid: room._id,
			msg: this.convertSlackMessageToRocketChat(message.message.text)
		};

		RocketChat.updateMessage(msgObj, user);
	}

	/**
	Uploads the file to the storage.
	@param [Object] details an object with details about the upload. name, size, type, and rid
	@param [String] fileUrl url of the file to download/import
	@param [Object] user the Rocket.Chat user
	@param [Object] room the Rocket.Chat room
	@param [Date] timeStamp the timestamp the file was uploaded
	**/
	uploadFile(details, fileUrl, user, room, timeStamp, importing) {
		let url = Npm.require('url');
		let requestModule = /https/i.test(fileUrl) ? Npm.require('https') : Npm.require('http');
		var parsedUrl = url.parse(fileUrl, true);
		parsedUrl.headers = { 'Authorization': 'Bearer ' + this.apiToken };
		requestModule.get(parsedUrl, Meteor.bindEnvironment((stream) => {
			let fileId = Meteor.fileStore.create(details);
			if (fileId) {
				Meteor.fileStore.write(stream, fileId, (err, file) => {
					console.log('fileStore.write', file);
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

						if (importing) {
							msg.imported = 'slackbridge';
						}

						if (details.message_id && (typeof details.message_id === 'string')) {
							msg['_id'] = details.message_id;
						}

						return RocketChat.sendMessage(user, msg, room, true);
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

		/**
		* Event fired when someone messages a channel the bot is in
		* {
		*	type: 'message',
		* 	channel: [channel_id],
		* 	user: [user_id],
		* 	text: [message],
		* 	ts: [ts.milli],
		* 	team: [team_id],
		* 	subtype: [message_subtype],
		* 	inviter: [message_subtype = 'group_join|channel_join' -> user_id]
		* }
		**/
		this.rtm.on(RTM_EVENTS.MESSAGE, Meteor.bindEnvironment((message) => {
			logger.events.debug('MESSAGE: ', message);
			if (message) {
				this.saveMessage(message);
			}
		}));

		/**
		* Event fired when someone creates a public channel
		* {
		*	type: 'channel_created',
		*	channel: {
		*		id: [channel_id],
		*		is_channel: true,
		*		name: [channel_name],
		*		created: [ts],
		*		creator: [user_id],
		*		is_shared: false,
		*		is_org_shared: false
		*	},
		*	event_ts: [ts.milli]
		* }
		**/
		this.rtm.on(RTM_EVENTS.CHANNEL_CREATED, Meteor.bindEnvironment(() => {}));

		/**
		* Event fired when the bot joins a public channel
		* {
		* 	type: 'channel_joined',
		* 	channel: {
		* 		id: [channel_id],
		* 		name: [channel_name],
		* 		is_channel: true,
		* 		created: [ts],
		* 		creator: [user_id],
		* 		is_archived: false,
		* 		is_general: false,
		* 		is_member: true,
		* 		last_read: [ts.milli],
		* 		latest: [message_obj],
		* 		unread_count: 0,
		* 		unread_count_display: 0,
		* 		members: [ user_ids ],
		* 		topic: {
		* 			value: [channel_topic],
		* 			creator: [user_id],
		* 			last_set: 0
		* 		},
		* 		purpose: {
		* 			value: [channel_purpose],
		* 			creator: [user_id],
		* 			last_set: 0
		* 		}
		* 	}
		* }
		**/
		this.rtm.on(RTM_EVENTS.CHANNEL_JOINED, Meteor.bindEnvironment(() => {}));

		/**
		* Event fired when the bot leaves (or is removed from) a public channel
		* {
		* 	type: 'channel_left',
		* 	channel: [channel_id]
		* }
		**/
		this.rtm.on(RTM_EVENTS.CHANNEL_LEFT, Meteor.bindEnvironment(() => {}));

		/**
		* Event fired when an archived channel is deleted by an admin
		* {
		* 	type: 'channel_deleted',
		* 	channel: [channel_id],
		*	event_ts: [ts.milli]
		* }
		**/
		this.rtm.on(RTM_EVENTS.CHANNEL_DELETED, Meteor.bindEnvironment(() => {}));

		/**
		* Event fired when the channel has its name changed
		* {
		* 	type: 'channel_rename',
		* 	channel: {
		* 		id: [channel_id],
		* 		name: [channel_name],
		* 		is_channel: true,
		* 		created: [ts]
		* 	},
		*	event_ts: [ts.milli]
		* }
		**/
		this.rtm.on(RTM_EVENTS.CHANNEL_RENAME, Meteor.bindEnvironment(() => {}));

		/**
		* Event fired when the bot joins a private channel
		* {
		* 	type: 'group_joined',
		* 	channel: {
		* 		id: [channel_id],
		* 		name: [channel_name],
		* 		is_group: true,
		* 		created: [ts],
		* 		creator: [user_id],
		* 		is_archived: false,
		* 		is_mpim: false,
		* 		is_open: true,
		* 		last_read: [ts.milli],
		* 		latest: [message_obj],
		* 		unread_count: 0,
		* 		unread_count_display: 0,
		* 		members: [ user_ids ],
		* 		topic: {
		* 			value: [channel_topic],
		* 			creator: [user_id],
		* 			last_set: 0
		* 		},
		* 		purpose: {
		* 			value: [channel_purpose],
		* 			creator: [user_id],
		* 			last_set: 0
		* 		}
		* 	}
		* }
		**/
		this.rtm.on(RTM_EVENTS.GROUP_JOINED, Meteor.bindEnvironment(() => {}));

		/**
		* Event fired when the bot leaves (or is removed from) a private channel
		* {
		* 	type: 'group_left',
		* 	channel: [channel_id]
		* }
		**/
		this.rtm.on(RTM_EVENTS.GROUP_LEFT, Meteor.bindEnvironment(() => {}));

		/**
		* Event fired when the private channel has its name changed
		* {
		* 	type: 'group_rename',
		* 	channel: {
		* 		id: [channel_id],
		* 		name: [channel_name],
		* 		is_group: true,
		* 		created: [ts]
		* 	},
		*	event_ts: [ts.milli]
		* }
		**/
		this.rtm.on(RTM_EVENTS.GROUP_RENAME, Meteor.bindEnvironment(() => {}));

		/**
		* Event fired when a new user joins the team
		* {
		* 	type: 'team_join',
		* 	user:
		* 	{
		* 		id: [user_id],
		* 		team_id: [team_id],
		* 		name: [user_name],
		* 		deleted: false,
		* 		status: null,
		* 		color: [color_code],
		* 		real_name: '',
		* 		tz: [timezone],
		* 		tz_label: [timezone_label],
		* 		tz_offset: [timezone_offset],
		* 		profile:
		* 		{
		* 			avatar_hash: '',
		* 			real_name: '',
		* 			real_name_normalized: '',
		* 			email: '',
		* 			image_24: '',
		* 			image_32: '',
		* 			image_48: '',
		* 			image_72: '',
		* 			image_192: '',
		* 			image_512: '',
		* 			fields: null
		* 		},
		* 		is_admin: false,
		* 		is_owner: false,
		* 		is_primary_owner: false,
		* 		is_restricted: false,
		* 		is_ultra_restricted: false,
		* 		is_bot: false,
		* 		presence: [user_presence]
		* 	},
		* 	cache_ts: [ts]
		* }
		**/
		this.rtm.on(RTM_EVENTS.TEAM_JOIN, Meteor.bindEnvironment(() => {}));
	}

	findSlackChannel(name) {
		logger.class.debug('Searching for Slack channel or group', name);
		let response = HTTP.get('https://slack.com/api/channels.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
			for (let channel of response.data.channels) {
				if (channel.name === name && channel.is_member === true) {
					return channel;
				}
			}
		}
		response = HTTP.get('https://slack.com/api/groups.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
			for (let group of response.data.groups) {
				if (group.name === name) {
					return group;
				}
			}
		}
	}

	importFromHistory(family, options) {
		logger.class.debug('Importing messages history');
		let response = HTTP.get('https://slack.com/api/' + family + '.history', { params: _.extend({ token: this.apiToken }, options) });
		if (response && response.data && _.isArray(response.data.messages) && response.data.messages.length > 0) {
			let latest = 0;
			for (let message of response.data.messages.reverse()) {
				logger.class.debug('MESSAGE: ', message);
				if (!latest || message.ts > latest) {
					latest = message.ts;
				}
				message.channel = options.channel;
				this.saveMessage(message, true);
			}
			return { has_more: response.data.has_more, ts: latest };
		}
	}

	copyChannelInfo(rid, channelMap) {
		logger.class.debug('Copying users from Slack channel to Rocket.Chat', channelMap.id, rid);
		let response = HTTP.get('https://slack.com/api/' + channelMap.family + '.info', { params: { token: this.apiToken, channel: channelMap.id } });
		if (response && response.data) {
			let data = channelMap.family === 'channels' ? response.data.channel : response.data.group;
			if (data && _.isArray(data.members) && data.members.length > 0) {
				for (let member of data.members) {
					let user = this.findUser(member) || this.addUser(member);
					if (user) {
						logger.class.debug('Adding user to room', user.username, rid);
						RocketChat.addUserToRoom(rid, user, null, true);
					}
				}
			}

			let topic = '';
			let topic_last_set = 0;
			let topic_creator = null;
			if (data && data.topic && data.topic.value) {
				topic = data.topic.value;
				topic_last_set = data.topic.last_set;
				topic_creator = data.topic.creator;
			}

			if (data && data.purpose && data.purpose.value) {
				if (topic_last_set) {
					if (topic_last_set < data.purpose.last_set) {
						topic = data.purpose.topic;
						topic_creator = data.purpose.creator;
					}
				} else {
					topic = data.purpose.topic;
					topic_creator = data.purpose.creator;
				}
			}

			if (topic) {
				let creator = this.findUser(topic_creator) || this.addUser(topic_creator);
				logger.class.debug('Setting room topic', rid, topic, creator.username);
				RocketChat.saveRoomTopic(rid, topic, creator, false);
			}
		}
	}

	copyPins(rid, channelMap) {
		let response = HTTP.get('https://slack.com/api/pins.list', { params: { token: this.apiToken, channel: channelMap.id } });
		if (response && response.data && _.isArray(response.data.items) && response.data.items.length > 0) {
			for (let pin of response.data.items) {
				if (pin.message) {
					let user = this.findUser(pin.message.user);
					let msgObj = {
						rid: rid,
						t: 'message_pinned',
						msg: '',
						u: {
							_id: user._id,
							username: user.username
						},
						attachments: [{
							'text' : this.convertSlackMessageToRocketChat(pin.message.text),
							'author_name' : user.username,
							'author_icon' : getAvatarUrlFromUsername(user.username),
							'ts' : new Date(parseInt(pin.message.ts.split('.')[0]) * 1000)
						}]
					};

					RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${pin.channel}-${pin.message.ts.replace(/\./g, '-')}`, msgObj.u, true, new Date(parseInt(pin.message.ts.split('.')[0]) * 1000));
				}
			}
		}
	}

	importMessages(rid, callback) {
		logger.class.info('importMessages: ', rid);
		let rocketchat_room = RocketChat.models.Rooms.findOneById(rid);
		if (rocketchat_room) {
			if (this.channelMap[rid]) {
				this.copyChannelInfo(rid, this.channelMap[rid]);

				logger.class.debug('Importing messages from Slack to Rocket.Chat', this.channelMap[rid], rid);
				let results = this.importFromHistory(this.channelMap[rid].family, { channel: this.channelMap[rid].id, oldest: 1 });
				while (results && results.has_more) {
					results = this.importFromHistory(this.channelMap[rid].family, { channel: this.channelMap[rid].id, oldest: results.ts });
				}

				logger.class.debug('Pinning Slack channel messages to Rocket.Chat', this.channelMap[rid], rid);
				this.copyPins(rid, this.channelMap[rid]);

				return callback();
			} else {
				let slack_room = this.findSlackChannel(rocketchat_room.name);
				if (slack_room) {
					this.channelMap[rid] = { id: slack_room.id, family: slack_room.id.charAt(0) === 'C' ? 'channels' : 'groups' };
					return this.importMessages(rid, callback);
				} else {
					logger.class.error('Could not find Slack room with specified name', rocketchat_room.name);
					return callback(new Meteor.Error('error-slack-room-not-found', 'Could not find Slack room with specified name'));
				}
			}
		} else {
			logger.class.error('Could not find Rocket.Chat room with specified id', rid);
			return callback(new Meteor.Error('error-invalid-room', 'Invalid room'));
		}
	}

	populateChannelMap() {
		logger.class.debug('Populating channel map');
		let response = HTTP.get('https://slack.com/api/channels.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
			for (let channel of response.data.channels) {
				let rocketchat_room = RocketChat.models.Rooms.findOneByName(channel.name, { fields: { _id: 1 } });
				if (rocketchat_room) {
					this.channelMap[rocketchat_room._id] = { id: channel.id, family: channel.id.charAt(0) === 'C' ? 'channels' : 'groups' };
				}
			}
		}
		response = HTTP.get('https://slack.com/api/groups.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
			for (let group of response.data.groups) {
				let rocketchat_room = RocketChat.models.Rooms.findOneByName(group.name, { fields: { _id: 1 } });
				if (rocketchat_room) {
					this.channelMap[rocketchat_room._id] = { id: group.id, family: group.id.charAt(0) === 'C' ? 'channels' : 'groups' };
				}
			}
		}
	}

	slackBridgeOut(message) {
		// Ignore messages originating from Slack
		if (message._id.indexOf('slack-') === 0) {
			return message;
		}
		let outChannels = RocketChat.settings.get('SlackBridge_Out_All') ? _.keys(this.channelMap) : _.pluck(RocketChat.settings.get('SlackBridge_Out_Channels'), '_id') || [];
		logger.class.debug('Out Channels: ', outChannels);
		if (outChannels.indexOf(message.rid) !== -1) {
			logger.class.debug('Message out', message);
			this.postMessage(this.channelMap[message.rid], message);
		}
		return message;
	}

	postMessage(room, message) {
		if (room && room.id) {
			let data = {
				token: this.apiToken,
				text: message.msg,
				channel: room.id,
				username: message.u && message.u.username,
				icon_url: getAvatarUrlFromUsername(message.u && message.u.username),
				link_names: 1
			};
			logger.class.debug('Post Message', data);
			HTTP.post('https://slack.com/api/chat.postMessage', { params: data });
		}
	}
}

RocketChat.SlackBridge = new SlackBridge;
