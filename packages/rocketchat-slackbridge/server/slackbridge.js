/* globals logger */
/*eslint complexity: ["error", 50]*/
import _ from 'underscore';
import util from 'util';
import url from 'url';
import http from 'http';
import https from 'https';

class SlackBridge {

	constructor() {
		this.util = util;
		this.slackClient = require('slack-client');
		this.apiToken = RocketChat.settings.get('SlackBridge_APIToken');
		this.aliasFormat = RocketChat.settings.get('SlackBridge_AliasFormat');
		this.excludeBotnames = RocketChat.settings.get('SlackBridge_Botnames');
		this.rtm = {};
		this.connected = false;
		this.userTags = {};
		this.slackChannelMap = {};
		this.reactionsMap = new Map();

		RocketChat.settings.get('SlackBridge_APIToken', (key, value) => {
			if (value !== this.apiToken) {
				this.apiToken = value;
				if (this.connected) {
					this.disconnect();
					this.connect();
				}
			}
		});

		RocketChat.settings.get('SlackBridge_AliasFormat', (key, value) => {
			this.aliasFormat = value;
		});

		RocketChat.settings.get('SlackBridge_ExcludeBotnames', (key, value) => {
			this.excludeBotnames = value;
		});

		RocketChat.settings.get('SlackBridge_Enabled', (key, value) => {
			if (value && this.apiToken) {
				this.connect();
			} else {
				this.disconnect();
			}
		});
	}

	connect() {
		if (this.connected === false) {
			this.connected = true;
			logger.connection.info('Connecting via token: ', this.apiToken);
			const RtmClient = this.slackClient.RtmClient;
			this.rtm = new RtmClient(this.apiToken);
			this.rtm.start();
			this.registerForSlackEvents();
			RocketChat.settings.get('SlackBridge_Out_Enabled', (key, value) => {
				if (value) {
					this.registerForRocketEvents();
				} else {
					this.unregisterForRocketEvents();
				}
			});
			Meteor.startup(() => {
				try {
					this.populateSlackChannelMap(); // If run outside of Meteor.startup, HTTP is not defined
				} catch (err) {
					logger.class.error('Error attempting to connect to Slack', err);
					this.disconnect();
				}
			});
		}
	}

	disconnect() {
		if (this.connected === true) {
			this.connected = false;
			this.rtm.disconnect && this.rtm.disconnect();
			logger.connection.info('Disconnected');
			this.unregisterForRocketEvents();
		}
	}

	convertSlackMsgTxtToRocketTxtFormat(slackMsgTxt) {
		if (!_.isEmpty(slackMsgTxt)) {
			slackMsgTxt = slackMsgTxt.replace(/<!everyone>/g, '@all');
			slackMsgTxt = slackMsgTxt.replace(/<!channel>/g, '@all');
			slackMsgTxt = slackMsgTxt.replace(/<!here>/g, '@here');
			slackMsgTxt = slackMsgTxt.replace(/&gt;/g, '>');
			slackMsgTxt = slackMsgTxt.replace(/&lt;/g, '<');
			slackMsgTxt = slackMsgTxt.replace(/&amp;/g, '&');
			slackMsgTxt = slackMsgTxt.replace(/:simple_smile:/g, ':smile:');
			slackMsgTxt = slackMsgTxt.replace(/:memo:/g, ':pencil:');
			slackMsgTxt = slackMsgTxt.replace(/:piggy:/g, ':pig:');
			slackMsgTxt = slackMsgTxt.replace(/:uk:/g, ':gb:');
			slackMsgTxt = slackMsgTxt.replace(/<(http[s]?:[^>]*)>/g, '$1');

			slackMsgTxt.replace(/(?:<@)([a-zA-Z0-9]+)(?:\|.+)?(?:>)/g, (match, userId) => {
				if (!this.userTags[userId]) {
					this.findRocketUser(userId) || this.addRocketUser(userId); // This adds userTags for the userId
				}
				const userTags = this.userTags[userId];
				if (userTags) {
					slackMsgTxt = slackMsgTxt.replace(userTags.slack, userTags.rocket);
				}
			});
		} else {
			slackMsgTxt = '';
		}
		return slackMsgTxt;
	}

	findRocketChannel(slackChannelId) {
		return RocketChat.models.Rooms.findOneByImportId(slackChannelId);
	}

	addRocketChannel(slackChannelID, hasRetried = false) {
		logger.class.debug('Adding Rocket.Chat channel from Slack', slackChannelID);
		let slackResults = null;
		let isGroup = false;
		if (slackChannelID.charAt(0) === 'C') {
			slackResults = HTTP.get('https://slack.com/api/channels.info', { params: { token: this.apiToken, channel: slackChannelID } });
		} else if (slackChannelID.charAt(0) === 'G') {
			slackResults = HTTP.get('https://slack.com/api/groups.info', { params: { token: this.apiToken, channel: slackChannelID } });
			isGroup = true;
		}
		if (slackResults && slackResults.data && slackResults.data.ok === true) {
			const rocketChannelData = isGroup ? slackResults.data.group : slackResults.data.channel;
			const existingRocketRoom = RocketChat.models.Rooms.findOneByName(rocketChannelData.name);

			// If the room exists, make sure we have its id in importIds
			if (existingRocketRoom || rocketChannelData.is_general) {
				rocketChannelData.rocketId = rocketChannelData.is_general ? 'GENERAL' : existingRocketRoom._id;
				RocketChat.models.Rooms.addImportIds(rocketChannelData.rocketId, rocketChannelData.id);
			} else {
				const rocketUsers = [];
				for (const member of rocketChannelData.members) {
					if (member !== rocketChannelData.creator) {
						const rocketUser = this.findRocketUser(member) || this.addRocketUser(member);
						if (rocketUser && rocketUser.username) {
							rocketUsers.push(rocketUser.username);
						}
					}
				}
				const rocketUserCreator = rocketChannelData.creator ? this.findRocketUser(rocketChannelData.creator) || this.addRocketUser(rocketChannelData.creator) : null;
				if (!rocketUserCreator) {
					logger.class.error('Could not fetch room creator information', rocketChannelData.creator);
					return;
				}

				try {
					const rocketChannel = RocketChat.createRoom(isGroup ? 'p' : 'c', rocketChannelData.name, rocketUserCreator.username, rocketUsers);
					rocketChannelData.rocketId = rocketChannel.rid;
				} catch (e) {
					if (!hasRetried) {
						logger.class.debug('Error adding channel from Slack. Will retry in 1s.', e.message);
						// If first time trying to create channel fails, could be because of multiple messages received at the same time. Try again once after 1s.
						Meteor._sleepForMs(1000);
						return this.findRocketChannel(slackChannelID) || this.addRocketChannel(slackChannelID, true);
					} else {
						console.log(e.message);
					}
				}

				const roomUpdate = {
					ts: new Date(rocketChannelData.created * 1000)
				};
				let lastSetTopic = 0;
				if (!_.isEmpty(rocketChannelData.topic && rocketChannelData.topic.value)) {
					roomUpdate.topic = rocketChannelData.topic.value;
					lastSetTopic = rocketChannelData.topic.last_set;
				}
				if (!_.isEmpty(rocketChannelData.purpose && rocketChannelData.purpose.value) && rocketChannelData.purpose.last_set > lastSetTopic) {
					roomUpdate.topic = rocketChannelData.purpose.value;
				}
				RocketChat.models.Rooms.addImportIds(rocketChannelData.rocketId, rocketChannelData.id);
				this.slackChannelMap[rocketChannelData.rocketId] = { id: slackChannelID, family: slackChannelID.charAt(0) === 'C' ? 'channels' : 'groups' };
			}
			return RocketChat.models.Rooms.findOneById(rocketChannelData.rocketId);
		}
		logger.class.debug('Channel not added');
		return;
	}

	findRocketUser(slackUserID) {
		const rocketUser = RocketChat.models.Users.findOneByImportId(slackUserID);
		if (rocketUser && !this.userTags[slackUserID]) {
			this.userTags[slackUserID] = { slack: `<@${ slackUserID }>`, rocket: `@${ rocketUser.username }` };
		}
		return rocketUser;
	}

	addRocketUser(slackUserID) {
		logger.class.debug('Adding Rocket.Chat user from Slack', slackUserID);
		const slackResults = HTTP.get('https://slack.com/api/users.info', { params: { token: this.apiToken, user: slackUserID } });
		if (slackResults && slackResults.data && slackResults.data.ok === true && slackResults.data.user) {
			const rocketUserData = slackResults.data.user;
			const isBot = rocketUserData.is_bot === true;
			const email = rocketUserData.profile && rocketUserData.profile.email || '';
			let existingRocketUser;
			if (!isBot) {
				existingRocketUser = RocketChat.models.Users.findOneByEmailAddress(email) || RocketChat.models.Users.findOneByUsername(rocketUserData.name);
			} else {
				existingRocketUser = RocketChat.models.Users.findOneByUsername(rocketUserData.name);
			}

			if (existingRocketUser) {
				rocketUserData.rocketId = existingRocketUser._id;
				rocketUserData.name = existingRocketUser.username;
			} else {
				const newUser = {
					password: Random.id(),
					username: rocketUserData.name
				};

				if (!isBot && email) {
					newUser.email = email;
				}

				if (isBot) {
					newUser.joinDefaultChannels = false;
				}

				rocketUserData.rocketId = Accounts.createUser(newUser);
				const userUpdate = {
					utcOffset: rocketUserData.tz_offset / 3600, // Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600,
					roles: isBot ? [ 'bot' ] : [ 'user' ]
				};

				if (rocketUserData.profile && rocketUserData.profile.real_name) {
					userUpdate['name'] = rocketUserData.profile.real_name;
				}

				if (rocketUserData.deleted) {
					userUpdate['active'] = false;
					userUpdate['services.resume.loginTokens'] = [];
				}

				RocketChat.models.Users.update({ _id: rocketUserData.rocketId }, { $set: userUpdate });

				const user = RocketChat.models.Users.findOneById(rocketUserData.rocketId);

				let url = null;
				if (rocketUserData.profile) {
					if (rocketUserData.profile.image_original) {
						url = rocketUserData.profile.image_original;
					} else if (rocketUserData.profile.image_512) {
						url = rocketUserData.profile.image_512;
					}
				}
				if (url) {
					try {
						RocketChat.setUserAvatar(user, url, null, 'url');
					} catch (error) {
						logger.class.debug('Error setting user avatar', error.message);
					}
				}
			}

			const importIds = [ rocketUserData.id ];
			if (isBot && rocketUserData.profile && rocketUserData.profile.bot_id) {
				importIds.push(rocketUserData.profile.bot_id);
			}
			RocketChat.models.Users.addImportIds(rocketUserData.rocketId, importIds);
			if (!this.userTags[slackUserID]) {
				this.userTags[slackUserID] = { slack: `<@${ slackUserID }>`, rocket: `@${ rocketUserData.name }` };
			}
			return RocketChat.models.Users.findOneById(rocketUserData.rocketId);
		}
		logger.class.debug('User not added');
		return;
	}

	addAliasToRocketMsg(rocketUserName, rocketMsgObj) {
		if (this.aliasFormat) {
			const alias = this.util.format(this.aliasFormat, rocketUserName);

			if (alias !== rocketUserName) {
				rocketMsgObj.alias = alias;
			}
		}

		return rocketMsgObj;
	}

	createAndSaveRocketMessage(rocketChannel, rocketUser, slackMessage, rocketMsgDataDefaults, isImporting) {
		if (slackMessage.type === 'message') {
			let rocketMsgObj = {};
			if (!_.isEmpty(slackMessage.subtype)) {
				rocketMsgObj = this.processSlackSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting);
				if (!rocketMsgObj) {
					return;
				}
			} else {
				rocketMsgObj = {
					msg: this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
					rid: rocketChannel._id,
					u: {
						_id: rocketUser._id,
						username: rocketUser.username
					}
				};

				this.addAliasToRocketMsg(rocketUser.username, rocketMsgObj);
			}
			_.extend(rocketMsgObj, rocketMsgDataDefaults);
			if (slackMessage.edited) {
				rocketMsgObj.editedAt = new Date(parseInt(slackMessage.edited.ts.split('.')[0]) * 1000);
			}
			if (slackMessage.subtype === 'bot_message') {
				rocketUser = RocketChat.models.Users.findOneById('rocket.cat', { fields: { username: 1 } });
			}

			if (slackMessage.pinned_to && slackMessage.pinned_to.indexOf(slackMessage.channel) !== -1) {
				rocketMsgObj.pinned = true;
				rocketMsgObj.pinnedAt = Date.now;
				rocketMsgObj.pinnedBy = _.pick(rocketUser, '_id', 'username');
			}
			if (slackMessage.subtype === 'bot_message') {
				Meteor.setTimeout(() => {
					if (slackMessage.bot_id && slackMessage.ts && !RocketChat.models.Messages.findOneBySlackBotIdAndSlackTs(slackMessage.bot_id, slackMessage.ts)) {
						RocketChat.sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
					}
				}, 500);
			} else {
				logger.class.debug('Send message to Rocket.Chat');
				RocketChat.sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
			}
		}
	}

	/*
	 https://api.slack.com/events/reaction_removed
	 */
	onSlackReactionRemoved(slackReactionMsg) {
		if (slackReactionMsg) {
			const rocketUser = this.getRocketUser(slackReactionMsg.user);
			//Lets find our Rocket originated message
			let rocketMsg = RocketChat.models.Messages.findOneBySlackTs(slackReactionMsg.item.ts);

			if (!rocketMsg) {
				//Must have originated from Slack
				const rocketID = this.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
				rocketMsg = RocketChat.models.Messages.findOneById(rocketID);
			}

			if (rocketMsg && rocketUser) {
				const rocketReaction = `:${ slackReactionMsg.reaction }:`;

				//If the Rocket user has already been removed, then this is an echo back from slack
				if (rocketMsg.reactions) {
					const theReaction = rocketMsg.reactions[rocketReaction];
					if (theReaction) {
						if (theReaction.usernames.indexOf(rocketUser.username) === -1) {
							return; //Reaction already removed
						}
					}
				} else {
					//Reaction already removed
					return;
				}

				//Stash this away to key off it later so we don't send it back to Slack
				this.reactionsMap.set(`unset${ rocketMsg._id }${ rocketReaction }`, rocketUser);
				logger.class.debug('Removing reaction from Slack');
				Meteor.runAsUser(rocketUser._id, () => {
					Meteor.call('setReaction', rocketReaction, rocketMsg._id);
				});
			}
		}
	}

	/*
	 https://api.slack.com/events/reaction_added
	 */
	onSlackReactionAdded(slackReactionMsg) {
		if (slackReactionMsg) {
			const rocketUser = this.getRocketUser(slackReactionMsg.user);

			if (rocketUser.roles.includes('bot')) {
				return;
			}

			//Lets find our Rocket originated message
			let rocketMsg = RocketChat.models.Messages.findOneBySlackTs(slackReactionMsg.item.ts);

			if (!rocketMsg) {
				//Must have originated from Slack
				const rocketID = this.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
				rocketMsg = RocketChat.models.Messages.findOneById(rocketID);
			}

			if (rocketMsg && rocketUser) {
				const rocketReaction = `:${ slackReactionMsg.reaction }:`;

				//If the Rocket user has already reacted, then this is Slack echoing back to us
				if (rocketMsg.reactions) {
					const theReaction = rocketMsg.reactions[rocketReaction];
					if (theReaction) {
						if (theReaction.usernames.indexOf(rocketUser.username) !== -1) {
							return; //Already reacted
						}
					}
				}

				//Stash this away to key off it later so we don't send it back to Slack
				this.reactionsMap.set(`set${ rocketMsg._id }${ rocketReaction }`, rocketUser);
				logger.class.debug('Adding reaction from Slack');
				Meteor.runAsUser(rocketUser._id, () => {
					Meteor.call('setReaction', rocketReaction, rocketMsg._id);
				});
			}
		}
	}

	/**
	 * We have received a message from slack and we need to save/delete/update it into rocket
	 * https://api.slack.com/events/message
	 */
	onSlackMessage(slackMessage, isImporting) {
		if (slackMessage.subtype) {
			switch (slackMessage.subtype) {
				case 'message_deleted':
					this.processSlackMessageDeleted(slackMessage);
					break;
				case 'message_changed':
					this.processSlackMessageChanged(slackMessage);
					break;
				default:
					//Keeping backwards compatability for now, refactor later
					this.processSlackNewMessage(slackMessage, isImporting);
			}
		} else {
			//Simple message
			this.processSlackNewMessage(slackMessage, isImporting);
		}
	}

	processSlackSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		let rocketMsgObj = null;
		switch (slackMessage.subtype) {
			case 'bot_message':
				if (slackMessage.username !== undefined && this.excludeBotnames && slackMessage.username.match(this.excludeBotnames)) {
					return;
				}

				rocketMsgObj = {
					msg: this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
					rid: rocketChannel._id,
					bot: true,
					attachments: slackMessage.attachments,
					username: slackMessage.username || slackMessage.bot_id
				};
				this.addAliasToRocketMsg(slackMessage.username || slackMessage.bot_id, rocketMsgObj);
				if (slackMessage.icons) {
					rocketMsgObj.emoji = slackMessage.icons.emoji;
				}
				return rocketMsgObj;
			case 'me_message':
				return this.addAliasToRocketMsg(rocketUser.username, {
					msg: `_${ this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text) }_`
				});
			case 'channel_join':
				if (isImporting) {
					RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rocketChannel._id, rocketUser, { ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
				} else {
					RocketChat.addUserToRoom(rocketChannel._id, rocketUser);
				}
				return;
			case 'group_join':
				if (slackMessage.inviter) {
					const inviter = slackMessage.inviter ? this.findRocketUser(slackMessage.inviter) || this.addRocketUser(slackMessage.inviter) : null;
					if (isImporting) {
						RocketChat.models.Messages.createUserAddedWithRoomIdAndUser(rocketChannel._id, rocketUser, {
							ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
							u: {
								_id: inviter._id,
								username: inviter.username
							},
							imported: 'slackbridge'
						});
					} else {
						RocketChat.addUserToRoom(rocketChannel._id, rocketUser, inviter);
					}
				}
				return;
			case 'channel_leave':
			case 'group_leave':
				if (isImporting) {
					RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(rocketChannel._id, rocketUser, {
						ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
						imported: 'slackbridge'
					});
				} else {
					RocketChat.removeUserFromRoom(rocketChannel._id, rocketUser);
				}
				return;
			case 'channel_topic':
			case 'group_topic':
				if (isImporting) {
					RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rocketChannel._id, slackMessage.topic, rocketUser, { ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
				} else {
					RocketChat.saveRoomTopic(rocketChannel._id, slackMessage.topic, rocketUser, false);
				}
				return;
			case 'channel_purpose':
			case 'group_purpose':
				if (isImporting) {
					RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rocketChannel._id, slackMessage.purpose, rocketUser, { ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
				} else {
					RocketChat.saveRoomTopic(rocketChannel._id, slackMessage.purpose, rocketUser, false);
				}
				return;
			case 'channel_name':
			case 'group_name':
				if (isImporting) {
					RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rocketChannel._id, slackMessage.name, rocketUser, { ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
				} else {
					RocketChat.saveRoomName(rocketChannel._id, slackMessage.name, rocketUser, false);
				}
				return;
			case 'channel_archive':
			case 'group_archive':
				if (!isImporting) {
					RocketChat.archiveRoom(rocketChannel);
				}
				return;
			case 'channel_unarchive':
			case 'group_unarchive':
				if (!isImporting) {
					RocketChat.unarchiveRoom(rocketChannel);
				}
				return;
			case 'file_share':
				if (slackMessage.file && slackMessage.file.url_private_download !== undefined) {
					const details = {
						message_id: `slack-${ slackMessage.ts.replace(/\./g, '-') }`,
						name: slackMessage.file.name,
						size: slackMessage.file.size,
						type: slackMessage.file.mimetype,
						rid: rocketChannel._id
					};
					return this.uploadFileFromSlack(details, slackMessage.file.url_private_download, rocketUser, rocketChannel, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), isImporting);
				}
				break;
			case 'file_comment':
				logger.class.error('File comment not implemented');
				return;
			case 'file_mention':
				logger.class.error('File mentioned not implemented');
				return;
			case 'pinned_item':
				if (slackMessage.attachments && slackMessage.attachments[0] && slackMessage.attachments[0].text) {
					rocketMsgObj = {
						rid: rocketChannel._id,
						t: 'message_pinned',
						msg: '',
						u: {
							_id: rocketUser._id,
							username: rocketUser.username
						},
						attachments: [{
							'text' : this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.attachments[0].text),
							'author_name' : slackMessage.attachments[0].author_subname,
							'author_icon' : getAvatarUrlFromUsername(slackMessage.attachments[0].author_subname),
							'ts' : new Date(parseInt(slackMessage.attachments[0].ts.split('.')[0]) * 1000)
						}]
					};

					if (!isImporting) {
						RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${ slackMessage.attachments[0].channel_id }-${ slackMessage.attachments[0].ts.replace(/\./g, '-') }`, rocketMsgObj.u, true, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000));
					}

					return rocketMsgObj;
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
	Uploads the file to the storage.
	@param [Object] details an object with details about the upload. name, size, type, and rid
	@param [String] fileUrl url of the file to download/import
	@param [Object] user the Rocket.Chat user
	@param [Object] room the Rocket.Chat room
	@param [Date] timeStamp the timestamp the file was uploaded
	**/
	//details, slackMessage.file.url_private_download, rocketUser, rocketChannel, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), isImporting);
	uploadFileFromSlack(details, slackFileURL, rocketUser, rocketChannel, timeStamp, isImporting) {
		const requestModule = /https/i.test(slackFileURL) ? https : http;
		const parsedUrl = url.parse(slackFileURL, true);
		parsedUrl.headers = { 'Authorization': `Bearer ${ this.apiToken }` };
		requestModule.get(parsedUrl, Meteor.bindEnvironment((stream) => {
			const fileStore = FileUpload.getStore('Uploads');

			fileStore.insert(details, stream, (err, file) => {
				if (err) {
					throw new Error(err);
				} else {
					const url = file.url.replace(Meteor.absoluteUrl(), '/');
					const attachment = {
						title: file.name,
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

					const msg = {
						rid: details.rid,
						ts: timeStamp,
						msg: '',
						file: {
							_id: file._id
						},
						groupable: false,
						attachments: [attachment]
					};

					if (isImporting) {
						msg.imported = 'slackbridge';
					}

					if (details.message_id && (typeof details.message_id === 'string')) {
						msg['_id'] = details.message_id;
					}

					return RocketChat.sendMessage(rocketUser, msg, rocketChannel, true);
				}
			});
		}));
	}

	registerForRocketEvents() {
		RocketChat.callbacks.add('afterSaveMessage', this.onRocketMessage.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_Out');
		RocketChat.callbacks.add('afterDeleteMessage', this.onRocketMessageDelete.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_Delete');
		RocketChat.callbacks.add('setReaction', this.onRocketSetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_SetReaction');
		RocketChat.callbacks.add('unsetReaction', this.onRocketUnSetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_UnSetReaction');
	}

	unregisterForRocketEvents() {
		RocketChat.callbacks.remove('afterSaveMessage', 'SlackBridge_Out');
		RocketChat.callbacks.remove('afterDeleteMessage', 'SlackBridge_Delete');
		RocketChat.callbacks.remove('setReaction', 'SlackBridge_SetReaction');
		RocketChat.callbacks.remove('unsetReaction', 'SlackBridge_UnSetReaction');
	}

	registerForSlackEvents() {
		const CLIENT_EVENTS = this.slackClient.CLIENT_EVENTS;
		this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, () => {
			logger.connection.info('Connected to Slack');
		});

		this.rtm.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, () => {
			this.disconnect();
		});

		this.rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, () => {
			this.disconnect();
		});

		const RTM_EVENTS = this.slackClient.RTM_EVENTS;

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
		this.rtm.on(RTM_EVENTS.MESSAGE, Meteor.bindEnvironment((slackMessage) => {
			logger.events.debug('OnSlackEvent-MESSAGE: ', slackMessage);
			if (slackMessage) {
				this.onSlackMessage(slackMessage);
			}
		}));

		this.rtm.on(RTM_EVENTS.REACTION_ADDED, Meteor.bindEnvironment((reactionMsg) => {
			logger.events.debug('OnSlackEvent-REACTION_ADDED: ', reactionMsg);
			if (reactionMsg) {
				this.onSlackReactionAdded(reactionMsg);
			}
		}));

		this.rtm.on(RTM_EVENTS.REACTION_REMOVED, Meteor.bindEnvironment((reactionMsg) => {
			logger.events.debug('OnSlackEvent-REACTION_REMOVED: ', reactionMsg);
			if (reactionMsg) {
				this.onSlackReactionRemoved(reactionMsg);
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

	findSlackChannel(rocketChannelName) {
		logger.class.debug('Searching for Slack channel or group', rocketChannelName);
		let response = HTTP.get('https://slack.com/api/channels.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
			for (const channel of response.data.channels) {
				if (channel.name === rocketChannelName && channel.is_member === true) {
					return channel;
				}
			}
		}
		response = HTTP.get('https://slack.com/api/groups.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
			for (const group of response.data.groups) {
				if (group.name === rocketChannelName) {
					return group;
				}
			}
		}
	}

	importFromHistory(family, options) {
		logger.class.debug('Importing messages history');
		const response = HTTP.get(`https://slack.com/api/${ family }.history`, { params: _.extend({ token: this.apiToken }, options) });
		if (response && response.data && _.isArray(response.data.messages) && response.data.messages.length > 0) {
			let latest = 0;
			for (const message of response.data.messages.reverse()) {
				logger.class.debug('MESSAGE: ', message);
				if (!latest || message.ts > latest) {
					latest = message.ts;
				}
				message.channel = options.channel;
				this.onSlackMessage(message, true);
			}
			return { has_more: response.data.has_more, ts: latest };
		}
	}

	copySlackChannelInfo(rid, channelMap) {
		logger.class.debug('Copying users from Slack channel to Rocket.Chat', channelMap.id, rid);
		const response = HTTP.get(`https://slack.com/api/${ channelMap.family }.info`, { params: { token: this.apiToken, channel: channelMap.id } });
		if (response && response.data) {
			const data = channelMap.family === 'channels' ? response.data.channel : response.data.group;
			if (data && _.isArray(data.members) && data.members.length > 0) {
				for (const member of data.members) {
					const user = this.findRocketUser(member) || this.addRocketUser(member);
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
				const creator = this.findRocketUser(topic_creator) || this.addRocketUser(topic_creator);
				logger.class.debug('Setting room topic', rid, topic, creator.username);
				RocketChat.saveRoomTopic(rid, topic, creator, false);
			}
		}
	}

	copyPins(rid, channelMap) {
		const response = HTTP.get('https://slack.com/api/pins.list', { params: { token: this.apiToken, channel: channelMap.id } });
		if (response && response.data && _.isArray(response.data.items) && response.data.items.length > 0) {
			for (const pin of response.data.items) {
				if (pin.message) {
					const user = this.findRocketUser(pin.message.user);
					const msgObj = {
						rid,
						t: 'message_pinned',
						msg: '',
						u: {
							_id: user._id,
							username: user.username
						},
						attachments: [{
							'text' : this.convertSlackMsgTxtToRocketTxtFormat(pin.message.text),
							'author_name' : user.username,
							'author_icon' : getAvatarUrlFromUsername(user.username),
							'ts' : new Date(parseInt(pin.message.ts.split('.')[0]) * 1000)
						}]
					};

					RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${ pin.channel }-${ pin.message.ts.replace(/\./g, '-') }`, msgObj.u, true, new Date(parseInt(pin.message.ts.split('.')[0]) * 1000));
				}
			}
		}
	}

	importMessages(rid, callback) {
		logger.class.info('importMessages: ', rid);
		const rocketchat_room = RocketChat.models.Rooms.findOneById(rid);
		if (rocketchat_room) {
			if (this.slackChannelMap[rid]) {
				this.copySlackChannelInfo(rid, this.slackChannelMap[rid]);

				logger.class.debug('Importing messages from Slack to Rocket.Chat', this.slackChannelMap[rid], rid);
				let results = this.importFromHistory(this.slackChannelMap[rid].family, { channel: this.slackChannelMap[rid].id, oldest: 1 });
				while (results && results.has_more) {
					results = this.importFromHistory(this.slackChannelMap[rid].family, { channel: this.slackChannelMap[rid].id, oldest: results.ts });
				}

				logger.class.debug('Pinning Slack channel messages to Rocket.Chat', this.slackChannelMap[rid], rid);
				this.copyPins(rid, this.slackChannelMap[rid]);

				return callback();
			} else {
				const slack_room = this.findSlackChannel(rocketchat_room.name);
				if (slack_room) {
					this.slackChannelMap[rid] = { id: slack_room.id, family: slack_room.id.charAt(0) === 'C' ? 'channels' : 'groups' };
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

	populateSlackChannelMap() {
		logger.class.debug('Populating channel map');
		let response = HTTP.get('https://slack.com/api/channels.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
			for (const slackChannel of response.data.channels) {
				const rocketchat_room = RocketChat.models.Rooms.findOneByName(slackChannel.name, { fields: { _id: 1 } });
				if (rocketchat_room) {
					this.slackChannelMap[rocketchat_room._id] = { id: slackChannel.id, family: slackChannel.id.charAt(0) === 'C' ? 'channels' : 'groups' };
				}
			}
		}
		response = HTTP.get('https://slack.com/api/groups.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
			for (const slackGroup of response.data.groups) {
				const rocketchat_room = RocketChat.models.Rooms.findOneByName(slackGroup.name, { fields: { _id: 1 } });
				if (rocketchat_room) {
					this.slackChannelMap[rocketchat_room._id] = { id: slackGroup.id, family: slackGroup.id.charAt(0) === 'C' ? 'channels' : 'groups' };
				}
			}
		}
	}

	onRocketMessageDelete(rocketMessageDeleted) {
		logger.class.debug('onRocketMessageDelete', rocketMessageDeleted);

		this.postDeleteMessageToSlack(rocketMessageDeleted);
	}

	onRocketSetReaction(rocketMsgID, reaction) {
		logger.class.debug('onRocketSetReaction');

		if (rocketMsgID && reaction) {
			if (this.reactionsMap.delete(`set${ rocketMsgID }${ reaction }`)) {
				//This was a Slack reaction, we don't need to tell Slack about it
				return;
			}
			const rocketMsg = RocketChat.models.Messages.findOneById(rocketMsgID);
			if (rocketMsg) {
				const slackChannel = this.slackChannelMap[rocketMsg.rid].id;
				const slackTS = this.getSlackTS(rocketMsg);
				this.postReactionAddedToSlack(reaction.replace(/:/g, ''), slackChannel, slackTS);
			}
		}
	}

	onRocketUnSetReaction(rocketMsgID, reaction) {
		logger.class.debug('onRocketUnSetReaction');

		if (rocketMsgID && reaction) {
			if (this.reactionsMap.delete(`unset${ rocketMsgID }${ reaction }`)) {
				//This was a Slack unset reaction, we don't need to tell Slack about it
				return;
			}

			const rocketMsg = RocketChat.models.Messages.findOneById(rocketMsgID);
			if (rocketMsg) {
				const slackChannel = this.slackChannelMap[rocketMsg.rid].id;
				const slackTS = this.getSlackTS(rocketMsg);
				this.postReactionRemoveToSlack(reaction.replace(/:/g, ''), slackChannel, slackTS);
			}
		}
	}

	onRocketMessage(rocketMessage) {
		logger.class.debug('onRocketMessage', rocketMessage);

		if (rocketMessage.editedAt) {
			//This is an Edit Event
			this.processRocketMessageChanged(rocketMessage);
			return rocketMessage;
		}
		// Ignore messages originating from Slack
		if (rocketMessage._id.indexOf('slack-') === 0) {
			return rocketMessage;
		}

		//Probably a new message from Rocket.Chat
		const outSlackChannels = RocketChat.settings.get('SlackBridge_Out_All') ? _.keys(this.slackChannelMap) : _.pluck(RocketChat.settings.get('SlackBridge_Out_Channels'), '_id') || [];
		//logger.class.debug('Out SlackChannels: ', outSlackChannels);
		if (outSlackChannels.indexOf(rocketMessage.rid) !== -1) {
			this.postMessageToSlack(this.slackChannelMap[rocketMessage.rid], rocketMessage);
		}
		return rocketMessage;
	}

	/*
	 https://api.slack.com/methods/reactions.add
	 */
	postReactionAddedToSlack(reaction, slackChannel, slackTS) {
		if (reaction && slackChannel && slackTS) {
			const data = {
				token: this.apiToken,
				name: reaction,
				channel: slackChannel,
				timestamp: slackTS
			};

			logger.class.debug('Posting Add Reaction to Slack');
			const postResult = HTTP.post('https://slack.com/api/reactions.add', { params: data });
			if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
				logger.class.debug('Reaction added to Slack');
			}
		}
	}

	/*
	 https://api.slack.com/methods/reactions.remove
	 */
	postReactionRemoveToSlack(reaction, slackChannel, slackTS) {
		if (reaction && slackChannel && slackTS) {
			const data = {
				token: this.apiToken,
				name: reaction,
				channel: slackChannel,
				timestamp: slackTS
			};

			logger.class.debug('Posting Remove Reaction to Slack');
			const postResult = HTTP.post('https://slack.com/api/reactions.remove', { params: data });
			if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
				logger.class.debug('Reaction removed from Slack');
			}
		}
	}

	postDeleteMessageToSlack(rocketMessage) {
		if (rocketMessage) {
			const data = {
				token: this.apiToken,
				ts: this.getSlackTS(rocketMessage),
				channel: this.slackChannelMap[rocketMessage.rid].id,
				as_user: true
			};

			logger.class.debug('Post Delete Message to Slack', data);
			const postResult = HTTP.post('https://slack.com/api/chat.delete', { params: data });
			if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
				logger.class.debug('Message deleted on Slack');
			}
		}
	}

	postMessageToSlack(slackChannel, rocketMessage) {
		if (slackChannel && slackChannel.id) {
			let iconUrl = getAvatarUrlFromUsername(rocketMessage.u && rocketMessage.u.username);
			if (iconUrl) {
				iconUrl = Meteor.absoluteUrl().replace(/\/$/, '') + iconUrl;
			}
			const data = {
				token: this.apiToken,
				text: rocketMessage.msg,
				channel: slackChannel.id,
				username: rocketMessage.u && rocketMessage.u.username,
				icon_url: iconUrl,
				link_names: 1
			};
			logger.class.debug('Post Message To Slack', data);
			const postResult = HTTP.post('https://slack.com/api/chat.postMessage', { params: data });
			if (postResult.statusCode === 200 && postResult.data && postResult.data.message && postResult.data.message.bot_id && postResult.data.message.ts) {
				RocketChat.models.Messages.setSlackBotIdAndSlackTs(rocketMessage._id, postResult.data.message.bot_id, postResult.data.message.ts);
				logger.class.debug(`RocketMsgID=${ rocketMessage._id } SlackMsgID=${ postResult.data.message.ts } SlackBotID=${ postResult.data.message.bot_id }`);
			}
		}
	}

	/*
	 https://api.slack.com/methods/chat.update
	 */
	postMessageUpdateToSlack(slackChannel, rocketMessage) {
		if (slackChannel && slackChannel.id) {
			const data = {
				token: this.apiToken,
				ts: this.getSlackTS(rocketMessage),
				channel: slackChannel.id,
				text: rocketMessage.msg,
				as_user: true
			};
			logger.class.debug('Post UpdateMessage To Slack', data);
			const postResult = HTTP.post('https://slack.com/api/chat.update', { params: data });
			if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
				logger.class.debug('Message updated on Slack');
			}
		}
	}

	processRocketMessageChanged(rocketMessage) {
		if (rocketMessage) {
			if (rocketMessage.updatedBySlack) {
				//We have already processed this
				delete rocketMessage.updatedBySlack;
				return;
			}

			//This was a change from Rocket.Chat
			const slackChannel = this.slackChannelMap[rocketMessage.rid];
			this.postMessageUpdateToSlack(slackChannel, rocketMessage);
		}
	}

	/*
	 https://api.slack.com/events/message/message_deleted
	 */
	processSlackMessageDeleted(slackMessage) {
		if (slackMessage.previous_message) {
			const rocketChannel = this.getRocketChannel(slackMessage);
			const rocketUser = RocketChat.models.Users.findOneById('rocket.cat', { fields: { username: 1 } });

			if (rocketChannel && rocketUser) {
				//Find the Rocket message to delete
				let rocketMsgObj = RocketChat.models.Messages
					.findOneBySlackBotIdAndSlackTs(slackMessage.previous_message.bot_id, slackMessage.previous_message.ts);

				if (!rocketMsgObj) {
					//Must have been a Slack originated msg
					const _id = this.createRocketID(slackMessage.channel, slackMessage.previous_message.ts);
					rocketMsgObj = RocketChat.models.Messages.findOneById(_id);
				}

				if (rocketMsgObj) {
					RocketChat.deleteMessage(rocketMsgObj, rocketUser);
					logger.class.debug('Rocket message deleted by Slack');
				}
			}
		}
	}

	/*
	 https://api.slack.com/events/message/message_changed
	 */
	processSlackMessageChanged(slackMessage) {
		if (slackMessage.previous_message) {
			const currentMsg = RocketChat.models.Messages.findOneById(this.createRocketID(slackMessage.channel, slackMessage.message.ts));

			//Only process this change, if its an actual update (not just Slack repeating back our Rocket original change)
			if (currentMsg && (slackMessage.message.text !== currentMsg.msg)) {
				const rocketChannel = this.getRocketChannel(slackMessage);
				const rocketUser = slackMessage.previous_message.user ? this.findRocketUser(slackMessage.previous_message.user) || this.addRocketUser(slackMessage.previous_message.user) : null;

				const rocketMsgObj = {
					//@TODO _id
					_id: this.createRocketID(slackMessage.channel, slackMessage.previous_message.ts),
					rid: rocketChannel._id,
					msg: this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.message.text),
					updatedBySlack: true	//We don't want to notify slack about this change since Slack initiated it
				};

				RocketChat.updateMessage(rocketMsgObj, rocketUser);
				logger.class.debug('Rocket message updated by Slack');
			}
		}
	}

	/*
	 This method will get refactored and broken down into single responsibilities
	 */
	processSlackNewMessage(slackMessage, isImporting) {
		const rocketChannel = this.getRocketChannel(slackMessage);
		let rocketUser = null;
		if (slackMessage.subtype === 'bot_message') {
			rocketUser = RocketChat.models.Users.findOneById('rocket.cat', { fields: { username: 1 } });
		} else {
			rocketUser = slackMessage.user ? this.findRocketUser(slackMessage.user) || this.addRocketUser(slackMessage.user) : null;
		}
		if (rocketChannel && rocketUser) {
			const msgDataDefaults = {
				_id: this.createRocketID(slackMessage.channel, slackMessage.ts),
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000)
			};
			if (isImporting) {
				msgDataDefaults['imported'] = 'slackbridge';
			}
			try {
				this.createAndSaveRocketMessage(rocketChannel, rocketUser, slackMessage, msgDataDefaults, isImporting);
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

	/**
	 * Retrieves the Slack TS from a Rocket msg that originated from Slack
	 * @param rocketMsg
	 * @returns Slack TS or undefined if not a message that originated from slack
	 * @private
	 */
	getSlackTS(rocketMsg) {
		//slack-G3KJGGE15-1483081061-000169
		let slackTS;
		let index = rocketMsg._id.indexOf('slack-');
		if (index === 0) {
			//This is a msg that originated from Slack
			slackTS = rocketMsg._id.substr(6, rocketMsg._id.length);
			index = slackTS.indexOf('-');
			slackTS = slackTS.substr(index+1, slackTS.length);
			slackTS = slackTS.replace('-', '.');
		} else {
			//This probably originated as a Rocket msg, but has been sent to Slack
			slackTS = rocketMsg.slackTs;
		}

		return slackTS;
	}

	getRocketChannel(slackMessage) {
		return slackMessage.channel ? this.findRocketChannel(slackMessage.channel) || this.addRocketChannel(slackMessage.channel) : null;
	}

	getRocketUser(slackUser) {
		return slackUser ? this.findRocketUser(slackUser) || this.addRocketUser(slackUser) : null;
	}

	createRocketID(slackChannel, ts) {
		return `slack-${ slackChannel }-${ ts.replace(/\./g, '-') }`;
	}

}

RocketChat.SlackBridge = new SlackBridge;
