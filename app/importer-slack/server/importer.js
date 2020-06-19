import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';

import {
	RawImports,
	Base,
	ProgressStep,
	Selection,
	SelectionChannel,
	SelectionUser,
	ImporterWebsocket,
} from '../../importer/server';
import { getUserAvatarURL } from '../../utils/lib/getUserAvatarURL';
import { Users, Rooms, Messages } from '../../models';
import { insertMessage, createDirectRoom } from '../../lib';
import { getValidRoomName } from '../../utils';
import { settings } from '../../settings/server';
import { MentionsParser } from '../../mentions/lib/MentionsParser';

export class SlackImporter extends Base {
	constructor(info, importRecord) {
		super(info, importRecord);
		this.userTags = [];
		this.bots = {};
	}

	parseData(data) {
		const dataString = data.toString();
		try {
			this.logger.debug('parsing file contents');
			return JSON.parse(dataString);
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	prepareUsingLocalFile(fullFilePath) {
		this.logger.debug('start preparing import operation');
		this.collection.remove({});

		const zip = new this.AdmZip(fullFilePath);
		const totalEntries = zip.getEntryCount();

		let tempChannels = [];
		let tempGroups = [];
		let tempMpims = [];
		let tempDMs = [];
		let tempUsers = [];
		let messagesCount = 0;
		let count = 0;

		ImporterWebsocket.progressUpdated({ rate: 0 });
		let oldRate = 0;

		const prepareChannelsFile = (entry, typeName, filterInvalidCreators = true) => {
			super.updateProgress(ProgressStep.PREPARING_CHANNELS);
			let data = JSON.parse(entry.getData().toString());

			if (filterInvalidCreators) {
				data = data.filter((channel) => channel.creator != null);
			}

			this.logger.debug(`loaded ${ data.length } ${ typeName }.`);

			// Insert the channels records.
			this.collection.insert({ import: this.importRecord._id, importer: this.name, type: typeName, channels: data });
			this.updateRecord({ 'count.channels': tempGroups.length + tempChannels.length + tempDMs.length + tempMpims.length + data.length });
			this.addCountToTotal(data.length);
			return data;
		};

		try {
			zip.forEach((entry) => {
				try {
					if (entry.entryName.includes('__MACOSX') || entry.entryName.includes('.DS_Store')) {
						return this.logger.debug(`Ignoring the file: ${ entry.entryName }`);
					}

					if (entry.entryName === 'channels.json') {
						tempChannels = prepareChannelsFile(entry, 'channels');
						return;
					}

					if (entry.entryName === 'groups.json') {
						tempGroups = prepareChannelsFile(entry, 'groups');
						return;
					}

					if (entry.entryName === 'mpims.json') {
						tempMpims = prepareChannelsFile(entry, 'mpims');
						return;
					}

					if (entry.entryName === 'dms.json') {
						tempDMs = prepareChannelsFile(entry, 'DMs', false);
						return;
					}

					if (entry.entryName === 'users.json') {
						super.updateProgress(ProgressStep.PREPARING_USERS);
						tempUsers = JSON.parse(entry.getData().toString());

						tempUsers.forEach((user) => {
							if (user.is_bot) {
								this.bots[user.profile.bot_id] = user;
							}
						});

						this.logger.debug(`loaded ${ tempUsers.length } users.`);

						// Insert the users record
						this.collection.insert({ import: this.importRecord._id, importer: this.name, type: 'users', users: tempUsers });
						this.updateRecord({ 'count.users': tempUsers.length });
						this.addCountToTotal(tempUsers.length);

						this.collection.insert({ import: this.importRecord._id, importer: this.name, type: 'bots', bots: this.bots });
						return;
					}

					if (!entry.isDirectory && entry.entryName.indexOf('/') > -1) {
						const item = entry.entryName.split('/');

						const channel = item[0];
						const date = item[1].split('.')[0];

						try {
							// Insert the messages records
							if (this.progress.step !== ProgressStep.PREPARING_MESSAGES) {
								super.updateProgress(ProgressStep.PREPARING_MESSAGES);
							}

							const tempMessages = JSON.parse(entry.getData().toString());
							messagesCount += tempMessages.length;
							this.updateRecord({ messagesstatus: `${ channel }/${ date }` });
							this.addCountToTotal(tempMessages.length);

							if (Base.getBSONSize(tempMessages) > Base.getMaxBSONSize()) {
								const tmp = Base.getBSONSafeArraysFromAnArray(tempMessages);
								Object.keys(tmp).forEach((i) => {
									const splitMsg = tmp[i];
									this.collection.insert({ import: this.importRecord._id, importer: this.name, type: 'messages', name: `${ channel }/${ date }.${ i }`, messages: splitMsg, channel, date, i });
								});
							} else {
								this.collection.insert({ import: this.importRecord._id, importer: this.name, type: 'messages', name: `${ channel }/${ date }`, messages: tempMessages, channel, date });
							}
						} catch (error) {
							this.logger.warn(`${ entry.entryName } is not a valid JSON file! Unable to import it.`);
						}
					}
				} catch (e) {
					this.logger.error(e);
				}

				try {
					count++;
					const rate = Math.floor(count * 1000 / totalEntries) / 10;
					if (rate > oldRate) {
						ImporterWebsocket.progressUpdated({ rate });
						oldRate = rate;
					}
				} catch (e) {
					console.error(e);
				}
			});
		} catch (e) {
			this.logger.error(e);
			throw e;
		}

		ImporterWebsocket.progressUpdated({ rate: 100 });
		this.updateRecord({ 'count.messages': messagesCount, messagesstatus: null });

		if ([tempUsers.length, tempChannels.length + tempGroups.length + tempDMs.length + tempMpims.length, messagesCount].some((e) => e === 0)) {
			this.logger.warn(`Loaded ${ tempUsers.length } users, ${ tempChannels.length } channels, ${ tempGroups.length } groups, ${ tempDMs.length } DMs, ${ tempMpims.length } multi party IMs and ${ messagesCount } messages`);
			super.updateProgress(ProgressStep.ERROR);
			return this.getProgress();
		}

		const selectionUsers = tempUsers.map((user) => new SelectionUser(user.id, user.name, user.profile.email, user.deleted, user.is_bot, !user.is_bot));
		const selectionChannels = tempChannels.map((channel) => new SelectionChannel(channel.id, channel.name, channel.is_archived, true, false));
		const selectionGroups = tempGroups.map((channel) => new SelectionChannel(channel.id, channel.name, channel.is_archived, true, true));
		const selectionMpims = tempMpims.map((channel) => new SelectionChannel(channel.id, channel.name, channel.is_archived, true, true));

		const selectionMessages = this.importRecord.count.messages;
		super.updateProgress(ProgressStep.USER_SELECTION);

		return new Selection(this.name, selectionUsers, selectionChannels.concat(selectionGroups).concat(selectionMpims), selectionMessages);
	}

	performUserImport(user, startedByUserId) {
		if (user.is_bot) {
			this._saveUserIdReference(user.id, 'rocket.cat', user.name, 'rocket.cat');
		}

		if (!user.do_import) {
			this.addCountCompleted(1);
			return;
		}

		Meteor.runAsUser(startedByUserId, () => {
			const existantUser = Users.findOneByEmailAddress(user.profile.email) || Users.findOneByUsernameIgnoringCase(user.name);
			if (existantUser) {
				user.rocketId = existantUser._id;
				Users.update({ _id: user.rocketId }, { $addToSet: { importIds: user.id } });
				this._saveUserIdReference(user.id, existantUser._id, user.name, existantUser.username);
			} else {
				const userId = user.profile.email ? Accounts.createUser({ email: user.profile.email, password: Date.now() + user.name + user.profile.email.toUpperCase() }) : Accounts.createUser({ username: user.name, password: Date.now() + user.name, joinDefaultChannelsSilenced: true });
				Meteor.runAsUser(userId, () => {
					Meteor.call('setUsername', user.name, { joinDefaultChannelsSilenced: true });

					const url = user.profile.image_original || user.profile.image_512;
					try {
						Meteor.call('setAvatarFromService', url, undefined, 'url');
					} catch (error) {
						this.logger.warn(`Failed to set ${ user.name }'s avatar from url ${ url }`);
						console.log(`Failed to set ${ user.name }'s avatar from url ${ url }`);
					}

					// Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600
					if (user.tz_offset) {
						Meteor.call('userSetUtcOffset', user.tz_offset / 3600);
					}
				});

				Users.update({ _id: userId }, { $addToSet: { importIds: user.id } });

				if (user.profile.real_name) {
					Users.setName(userId, user.profile.real_name);
				}

				// Deleted users are 'inactive' users in Rocket.Chat
				if (user.deleted) {
					Meteor.call('setUserActiveStatus', userId, false);
				}

				user.rocketId = userId;
				this._saveUserIdReference(user.id, userId, user.name, user.name);
			}

			this.addCountCompleted(1);
		});
	}

	parseMentions(message) {
		const mentionsParser = new MentionsParser({
			pattern: () => settings.get('UTF8_Names_Validation'),
			useRealName: () => settings.get('UI_Use_Real_Name'),
			me: () => 'me',
		});

		if (!message.mentions) {
			message.mentions = [];
		}
		const users = mentionsParser.getUserMentions(message.msg);
		users.forEach((user_id, index, arr) => {
			const user = user_id.slice(1, user_id.length);
			try {
				if (user === 'all' || user === 'here') {
					arr[index] = user;
				} else {
					arr[index] = Users.findOneByUsernameIgnoringCase(user);
				}
			} catch (e) {
				this.logger.warn(`Failed to import user mention with name: ${ user }`);
			}
		});
		message.mentions.push(...users);

		if (!message.channels) {
			message.channels = [];
		}
		const channels = mentionsParser.getChannelMentions(message.msg);
		channels.forEach((channel_name, index, arr) => {
			const chan = channel_name.slice(1, channel_name.length);
			try {
				const slackChannel = this.getSlackChannelFromName(chan);
				arr[index] = Rooms.findOneById(slackChannel.rocketId);
				arr[index].dname = chan; // Have to store name to display so parser can match it
			} catch (e) {
				this.logger.warn(`Failed to import channel mention with name: ${ chan }`);
			}
		});
		message.channels.push(...channels);
	}

	processMessageSubType(message, room, msgDataDefaults, missedTypes) {
		const ignoreTypes = { bot_add: true, file_comment: true, file_mention: true };

		let rocketUser = this.getRocketUserFromUserId(message.user);
		const useRocketCat = !rocketUser;

		if (useRocketCat) {
			rocketUser = this.getRocketUserFromUserId('rocket.cat');
		}

		if (!rocketUser) {
			return;
		}

		switch (message.subtype) {
			case 'channel_join':
			case 'group_join':
				if (!useRocketCat) {
					Messages.createUserJoinWithRoomIdAndUser(room._id, rocketUser, msgDataDefaults);
				}
				break;
			case 'channel_leave':
			case 'group_leave':
				if (!useRocketCat) {
					Messages.createUserLeaveWithRoomIdAndUser(room._id, rocketUser, msgDataDefaults);
				}
				break;
			case 'me_message': {
				const msgObj = {
					...msgDataDefaults,
					msg: `_${ this.convertSlackMessageToRocketChat(message.text) }_`,
				};
				this.parseMentions(msgObj);
				insertMessage(rocketUser, msgObj, room, this._anyExistingSlackMessage);
				break;
			}
			case 'bot_message':
			case 'slackbot_response': {
				const botUser = this.getRocketUserFromUserId('rocket.cat');
				const botUsername = this.bots[message.bot_id] ? this.bots[message.bot_id].name : message.username;
				const msgObj = {
					...msgDataDefaults,
					msg: this.convertSlackMessageToRocketChat(message.text),
					rid: room._id,
					bot: true,
					attachments: this.convertMessageAttachments(message.attachments),
					username: botUsername || undefined,
				};

				if (message.edited) {
					msgObj.editedAt = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
					const editedBy = this.getRocketUserFromUserId(message.edited.user);
					if (editedBy) {
						msgObj.editedBy = {
							_id: editedBy._id,
							username: editedBy.username,
						};
					}
				}

				if (message.icons) {
					msgObj.emoji = message.icons.emoji;
				}
				this.parseMentions(msgObj);
				insertMessage(botUser, msgObj, room, this._anyExistingSlackMessage);
				break;
			}

			case 'channel_purpose':
			case 'group_purpose':
				Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', room._id, message.purpose, rocketUser, msgDataDefaults);
				break;
			case 'channel_topic':
			case 'group_topic':
				Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, message.topic, rocketUser, msgDataDefaults);
				break;
			case 'channel_name':
			case 'group_name':
				Messages.createRoomRenamedWithRoomIdRoomNameAndUser(room._id, message.name, rocketUser, msgDataDefaults);
				break;
			case 'pinned_item':
				if (message.attachments) {
					const msgObj = {
						...msgDataDefaults,
						attachments: [{
							text: this.convertSlackMessageToRocketChat(message.attachments[0].text),
							author_name: message.attachments[0].author_subname,
							author_icon: getUserAvatarURL(message.attachments[0].author_subname),
						}],
					};

					Messages.createWithTypeRoomIdMessageAndUser('message_pinned', room._id, '', rocketUser, msgObj);
				} else {
					// TODO: make this better
					this.logger.debug('Pinned item with no attachment, needs work.');
					// Messages.createWithTypeRoomIdMessageAndUser 'message_pinned', room._id, '', @getRocketUserFromUserId(message.user), msgDataDefaults
				}
				break;
			case 'file_share':
				if (message.file && message.file.url_private_download !== undefined) {
					const details = {
						message_id: `slack-${ message.ts.replace(/\./g, '-') }`,
						name: message.file.name,
						size: message.file.size,
						type: message.file.mimetype,
						rid: room._id,
					};
					this.uploadFile(details, message.file.url_private_download, rocketUser, room, new Date(parseInt(message.ts.split('.')[0]) * 1000));
				}
				break;
			default:
				if (!missedTypes[message.subtype] && !ignoreTypes[message.subtype]) {
					missedTypes[message.subtype] = message;
				}
				break;
		}
	}

	performMessageImport(message, room, missedTypes, slackChannel) {
		const msgDataDefaults = {
			_id: `slack-${ slackChannel.id }-${ message.ts.replace(/\./g, '-') }`,
			ts: new Date(parseInt(message.ts.split('.')[0]) * 1000),
		};

		// Process the reactions
		if (message.reactions && message.reactions.length > 0) {
			msgDataDefaults.reactions = {};

			message.reactions.forEach((reaction) => {
				reaction.name = `:${ reaction.name }:`;
				msgDataDefaults.reactions[reaction.name] = { usernames: [] };

				if (reaction.users) {
					reaction.users.forEach((u) => {
						const rcUser = this.getRocketUserFromUserId(u);
						if (!rcUser) { return; }

						msgDataDefaults.reactions[reaction.name].usernames.push(rcUser.username);
					});
				}

				if (msgDataDefaults.reactions[reaction.name].usernames.length === 0) {
					delete msgDataDefaults.reactions[reaction.name];
				}
			});
		}

		if (message.type === 'message') {
			if (message.files) {
				const fileUser = this.getRocketUserFromUserId(message.user);
				let fileIndex = 0;

				message.files.forEach((file) => {
					fileIndex++;
					const msgObj = {
						_id: `slack-${ slackChannel.id }-${ message.ts.replace(/\./g, '-') }-file${ fileIndex }`,
						ts: msgDataDefaults.ts,
						msg: file.url_private_download || '',
						_importFile: this.convertSlackFileToPendingFile(file),
					};
					if (message.thread_ts && (message.thread_ts !== message.ts)) {
						msgObj.tmid = `slack-${ slackChannel.id }-${ message.thread_ts.replace(/\./g, '-') }`;
					}
					insertMessage(fileUser, msgObj, room, this._anyExistingSlackMessage);
				});
			}

			if (message.subtype && (message.subtype !== 'thread_broadcast')) {
				this.processMessageSubType(message, room, msgDataDefaults, missedTypes);
			} else {
				const user = this.getRocketUserFromUserId(message.user);
				if (user) {
					const msgObj = {
						...msgDataDefaults,
						msg: this.convertSlackMessageToRocketChat(message.text),
						rid: room._id,
						attachments: this.convertMessageAttachments(message.attachments),
						u: {
							_id: user._id,
							username: user.username,
						},
					};

					if (message.thread_ts) {
						if (message.thread_ts === message.ts) {
							if (message.reply_users) {
								msgObj.replies = [];
								message.reply_users.forEach(function(item) {
									msgObj.replies.push(item);
								});
							} else if (message.replies) {
								msgObj.replies = [];
								message.replies.forEach(function(item) {
									msgObj.replies.push(item.user);
								});
							} else {
								this.logger.warn(`Failed to import the parent comment, message: ${ msgDataDefaults._id }. Missing replies/reply_users field`);
							}

							msgObj.tcount = message.reply_count;
							msgObj.tlm = new Date(parseInt(message.latest_reply.split('.')[0]) * 1000);
						} else {
							msgObj.tmid = `slack-${ slackChannel.id }-${ message.thread_ts.replace(/\./g, '-') }`;
						}
					}

					if (message.edited) {
						msgObj.editedAt = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
						const editedBy = this.getRocketUserFromUserId(message.edited.user);
						if (editedBy) {
							msgObj.editedBy = {
								_id: editedBy._id,
								username: editedBy.username,
							};
						}
					}

					this.parseMentions(msgObj);
					try {
						insertMessage(this.getRocketUserFromUserId(message.user), msgObj, room, this._anyExistingSlackMessage);
					} catch (e) {
						this.logger.warn(`Failed to import the message: ${ msgDataDefaults._id }`);
					}
				}
			}
		}

		this.addCountCompleted(1);
	}

	_saveUserIdReference(slackId, rocketId, slackUsername, rocketUsername) {
		this._userIdReference[slackId] = rocketId;

		this.userTags.push({
			slack: `<@${ slackId }>`,
			slackLong: `<@${ slackId }|${ slackUsername }>`,
			rocket: `@${ rocketUsername }`,
		});
	}

	_getUserRocketId(slackId) {
		if (!this._userIdReference) {
			return;
		}

		return this._userIdReference[slackId];
	}

	_importUsers(startedByUserId) {
		this._userIdReference = {};

		super.updateProgress(ProgressStep.IMPORTING_USERS);
		this.users.users.forEach((user) => this.performUserImport(user, startedByUserId));
		this.collection.update({ _id: this.users._id }, { $set: { users: this.users.users } });
	}

	_importChannels(startedByUserId, channelNames) {
		if (!this.channels || !this.channels.channels) {
			return;
		}

		super.updateProgress(ProgressStep.IMPORTING_CHANNELS);
		this.channels.channels.forEach((channel) => {
			if (!channel.do_import) {
				this.addCountCompleted(1);
				return;
			}

			channelNames.push(channel.name);

			Meteor.runAsUser(startedByUserId, () => {
				const existingRoom = this._findExistingRoom(channel.name);

				if (existingRoom || channel.is_general) {
					if (channel.is_general && existingRoom && channel.name !== existingRoom.name) {
						Meteor.call('saveRoomSettings', 'GENERAL', 'roomName', channel.name);
					}

					channel.rocketId = channel.is_general ? 'GENERAL' : existingRoom._id;
					Rooms.update({ _id: channel.rocketId }, { $addToSet: { importIds: channel.id } });
				} else {
					const users = this._getChannelUserList(channel);
					const userId = this.getImportedRocketUserIdFromSlackUserId(channel.creator) || startedByUserId;

					Meteor.runAsUser(userId, () => {
						const returned = Meteor.call('createChannel', channel.name, users);
						channel.rocketId = returned.rid;
					});

					this._updateImportedChannelTopicAndDescription(channel);
				}

				this.addCountCompleted(1);
			});
		});

		this.collection.update({ _id: this.channels._id }, { $set: { channels: this.channels.channels } });
	}

	_findExistingRoom(name) {
		const existingRoom = Rooms.findOneByName(name);

		// If no room with that name is found, try applying name rules and searching again
		if (!existingRoom) {
			const newName = getValidRoomName(name, null, { allowDuplicates: true });

			if (newName !== name) {
				return Rooms.findOneByName(newName);
			}
		}

		return existingRoom;
	}

	_getChannelUserList(channel, returnObject = false, includeCreator = false) {
		return channel.members.reduce((ret, member) => {
			if (includeCreator || member !== channel.creator) {
				const user = this.getRocketUserFromUserId(member);
				// Don't add bots to the room's member list; Since they are all replaced with rocket.cat, it could cause duplicated subscriptions
				if (user && user.username && user._id !== 'rocket.cat') {
					if (returnObject) {
						ret.push(user);
					} else {
						ret.push(user.username);
					}
				}
			}
			return ret;
		}, []);
	}

	_importPrivateGroupList(startedByUserId, list, channelNames) {
		if (!list || !list.channels) {
			return;
		}

		list.channels.forEach((channel) => {
			if (!channel.do_import) {
				this.addCountCompleted(1);
				return;
			}

			channelNames.push(channel.name);

			Meteor.runAsUser(startedByUserId, () => {
				const existingRoom = this._findExistingRoom(channel.name);

				if (existingRoom) {
					channel.rocketId = existingRoom._id;
					Rooms.update({ _id: channel.rocketId }, { $addToSet: { importIds: channel.id } });
				} else {
					const users = this._getChannelUserList(channel);

					const userId = this.getImportedRocketUserIdFromSlackUserId(channel.creator) || startedByUserId;
					Meteor.runAsUser(userId, () => {
						const returned = Meteor.call('createPrivateGroup', channel.name, users);
						channel.rocketId = returned.rid;
					});

					this._updateImportedChannelTopicAndDescription(channel);
				}

				this.addCountCompleted(1);
			});
		});

		this.collection.update({ _id: list._id }, { $set: { channels: list.channels } });
	}

	_importGroups(startedByUserId, channelNames) {
		this._importPrivateGroupList(startedByUserId, this.groups, channelNames);
	}

	_updateImportedChannelTopicAndDescription(slackChannel) {
		// @TODO implement model specific function
		const roomUpdate = {
			ts: new Date(slackChannel.created * 1000),
		};

		if (!_.isEmpty(slackChannel.topic && slackChannel.topic.value)) {
			roomUpdate.topic = slackChannel.topic.value;
		}

		if (!_.isEmpty(slackChannel.purpose && slackChannel.purpose.value)) {
			roomUpdate.description = slackChannel.purpose.value;
		}

		Rooms.update({ _id: slackChannel.rocketId }, { $set: roomUpdate, $addToSet: { importIds: slackChannel.id } });
	}

	_importMpims(startedByUserId, channelNames) {
		if (!this.mpims || !this.mpims.channels) {
			return;
		}

		const maxUsers = settings.get('DirectMesssage_maxUsers') || 1;

		this.mpims.channels.forEach((channel) => {
			if (!channel.do_import) {
				this.addCountCompleted(1);
				return;
			}

			channelNames.push(channel.name);

			Meteor.runAsUser(startedByUserId, () => {
				const users = this._getChannelUserList(channel, true, true);
				const existingRoom = Rooms.findOneDirectRoomContainingAllUserIDs(users, { fields: { _id: 1 } });

				if (existingRoom) {
					channel.rocketId = existingRoom._id;
					Rooms.update({ _id: channel.rocketId }, { $addToSet: { importIds: channel.id } });
				} else {
					const userId = this.getImportedRocketUserIdFromSlackUserId(channel.creator) || startedByUserId;
					Meteor.runAsUser(userId, () => {
						// If there are too many users for a direct room, then create a private group instead
						if (users.length > maxUsers) {
							const usernames = users.map((user) => user.username);
							const group = Meteor.call('createPrivateGroup', channel.name, usernames);
							channel.rocketId = group.rid;
							return;
						}

						const newRoom = createDirectRoom(users);
						channel.rocketId = newRoom._id;
					});

					this._updateImportedChannelTopicAndDescription(channel);
				}

				this.addCountCompleted(1);
			});
		});

		this.collection.update({ _id: this.mpims._id }, { $set: { channels: this.mpims.channels } });
	}

	_importDMs(startedByUserId, channelNames) {
		if (!this.dms || !this.dms.channels) {
			return;
		}

		this.dms.channels.forEach((channel) => {
			channelNames.push(channel.id);

			if (!channel.members || channel.members.length !== 2) {
				this.addCountCompleted(1);
				return;
			}

			Meteor.runAsUser(startedByUserId, () => {
				const user1 = this.getRocketUserFromUserId(channel.members[0]);
				const user2 = this.getRocketUserFromUserId(channel.members[1]);

				const existingRoom = Rooms.findOneDirectRoomContainingAllUserIDs([user1, user2], { fields: { _id: 1 } });

				if (existingRoom) {
					channel.rocketId = existingRoom._id;
					Rooms.update({ _id: channel.rocketId }, { $addToSet: { importIds: channel.id } });
				} else {
					if (!user1) {
						this.logger.error(`DM creation: User not found for id ${ channel.members[0] } and channel id ${ channel.id }`);
						return;
					}

					if (!user2) {
						this.logger.error(`DM creation: User not found for id ${ channel.members[1] } and channel id ${ channel.id }`);
						return;
					}

					const roomInfo = Meteor.runAsUser(user1._id, () => Meteor.call('createDirectMessage', user2.username));
					channel.rocketId = roomInfo.rid;
					Rooms.update({ _id: channel.rocketId }, { $addToSet: { importIds: channel.id } });
				}

				this.addCountCompleted(1);
			});
		});

		this.collection.update({ _id: this.dms._id }, { $set: { channels: this.dms.channels } });
	}

	_importMessages(startedByUserId, channelNames) {
		const missedTypes = {};
		super.updateProgress(ProgressStep.IMPORTING_MESSAGES);
		for (const channel of channelNames) {
			const slackChannel = this.getSlackChannelFromName(channel);

			const room = Rooms.findOneById(slackChannel.rocketId, { fields: { usernames: 1, t: 1, name: 1 } });
			if (!room) {
				this.logger.error(`ROOM not found: ${ channel }`);
				continue;
			}
			const messagePacks = this.collection.find({ import: this.importRecord._id, type: 'messages', channel });

			Meteor.runAsUser(startedByUserId, () => {
				messagePacks.forEach((pack) => {
					const packId = pack.i ? `${ pack.date }.${ pack.i }` : pack.date;

					this.updateRecord({ messagesstatus: `${ channel }/${ packId } (${ pack.messages.length })` });
					pack.messages.forEach((message) => this.performMessageImport(message, room, missedTypes, slackChannel));
				});
			});
		}

		if (!_.isEmpty(missedTypes)) {
			console.log('Missed import types:', missedTypes);
		}
	}

	_applyUserSelection(importSelection) {
		Object.keys(importSelection.users).forEach((key) => {
			const user = importSelection.users[key];
			Object.keys(this.users.users).forEach((k) => {
				const u = this.users.users[k];
				if (u.id === user.user_id) {
					u.do_import = user.do_import;
				}
			});
		});
		this.collection.update({ _id: this.users._id }, { $set: { users: this.users.users } });
	}

	_applyChannelSelection(importSelection) {
		const iterateChannelList = (list, channel_id, do_import) => {
			Object.keys(list).forEach((k) => {
				const c = list[k];
				if (c.id === channel_id) {
					c.do_import = do_import;
				}
			});
		};

		Object.keys(importSelection.channels).forEach((key) => {
			const channel = importSelection.channels[key];

			if (this.channels && this.channels.channels) {
				iterateChannelList(this.channels.channels, channel.channel_id, channel.do_import);
			}

			if (this.groups && this.groups.channels) {
				iterateChannelList(this.groups.channels, channel.channel_id, channel.do_import);
			}

			if (this.mpims && this.mpims.channels) {
				iterateChannelList(this.mpims.channels, channel.channel_id, channel.do_import);
			}
		});

		if (this.channels && this.channels.channels) {
			this.collection.update({ _id: this.channels._id }, { $set: { channels: this.channels.channels } });
		}

		if (this.groups && this.groups.channels) {
			this.collection.update({ _id: this.groups._id }, { $set: { channels: this.groups.channels } });
		}

		if (this.mpims && this.mpims.channels) {
			this.collection.update({ _id: this.mpims._id }, { $set: { channels: this.mpims.channels } });
		}
	}

	startImport(importSelection) {
		const bots = this.collection.findOne({ import: this.importRecord._id, type: 'bots' });
		if (bots) {
			this.bots = bots.bots || {};
		} else {
			this.bots = {};
		}

		this.users = RawImports.findOne({ import: this.importRecord._id, type: 'users' });
		this.channels = RawImports.findOne({ import: this.importRecord._id, type: 'channels' });
		this.groups = RawImports.findOne({ import: this.importRecord._id, type: 'groups' });
		this.dms = RawImports.findOne({ import: this.importRecord._id, type: 'DMs' });
		this.mpims = RawImports.findOne({ import: this.importRecord._id, type: 'mpims' });

		this._userDataCache = {};
		this._anyExistingSlackMessage = Boolean(Messages.findOne({ _id: /slack\-.*/ }));
		this.reloadCount();

		super.startImport(importSelection);
		const start = Date.now();

		this._applyUserSelection(importSelection);
		this._applyChannelSelection(importSelection);

		const channelNames = [];

		const startedByUserId = Meteor.userId();
		Meteor.defer(() => {
			try {
				this._importUsers(startedByUserId);

				super.updateProgress(ProgressStep.IMPORTING_CHANNELS);
				this._importChannels(startedByUserId, channelNames);
				this._importGroups(startedByUserId, channelNames);
				this._importMpims(startedByUserId, channelNames);

				this._importDMs(startedByUserId, channelNames);

				this._importMessages(startedByUserId, channelNames);

				super.updateProgress(ProgressStep.FINISHING);

				try {
					if (this.channels) {
						this._archiveChannelsAsNeeded(startedByUserId, this.channels);
					}
					if (this.groups) {
						this._archiveChannelsAsNeeded(startedByUserId, this.groups);
					}
					if (this.mpims) {
						this._archiveChannelsAsNeeded(startedByUserId, this.mpims);
					}
				} catch (e) {
					// If it failed to archive some channel, it's no reason to flag the import as incomplete
					// Just report the error but keep the import as successful.
					console.error(e);
				}
				super.updateProgress(ProgressStep.DONE);

				this.logger.log(`Import took ${ Date.now() - start } milliseconds.`);
			} catch (e) {
				this.logger.error(e);
				super.updateProgress(ProgressStep.ERROR);
			}

			this._userIdReference = {};
		});

		return this.getProgress();
	}

	_archiveChannelsAsNeeded(startedByUserId, list) {
		list.channels.forEach((channel) => {
			if (channel.do_import && channel.is_archived && channel.rocketId) {
				Meteor.runAsUser(startedByUserId, function() {
					Meteor.call('archiveRoom', channel.rocketId);
				});
			}
		});
	}

	getSlackChannelFromName(channelName) {
		if (this.channels && this.channels.channels) {
			const channel = this.channels.channels.find((channel) => channel.name === channelName);
			if (channel) {
				return channel;
			}
		}

		if (this.groups && this.groups.channels) {
			const group = this.groups.channels.find((channel) => channel.name === channelName);
			if (group) {
				return group;
			}
		}

		if (this.mpims && this.mpims.channels) {
			const group = this.mpims.channels.find((channel) => channel.name === channelName);
			if (group) {
				return group;
			}
		}

		if (this.dms && this.dms.channels) {
			const dm = this.dms.channels.find((channel) => channel.id === channelName);
			if (dm) {
				return dm;
			}
		}
	}

	_getBasicUserData(userId) {
		if (this._userDataCache[userId]) {
			return this._userDataCache[userId];
		}

		this._userDataCache[userId] = Users.findOneById(userId, { fields: { username: 1, name: 1 } });
		return this._userDataCache[userId];
	}

	getRocketUserFromUserId(userId) {
		if (userId === 'rocket.cat' || userId === 'USLACKBOT') {
			return this._getBasicUserData('rocket.cat');
		}

		const rocketId = this._getUserRocketId(userId);
		if (rocketId) {
			return this._getBasicUserData(rocketId);
		}

		if (userId in this.bots) {
			return this._getBasicUserData('rocket.cat');
		}
	}

	getImportedRocketUserIdFromSlackUserId(slackUserId) {
		if (slackUserId.toUpperCase() === 'USLACKBOT') {
			return 'rocket.cat';
		}

		for (const user of this.users.users) {
			if (user.id !== slackUserId) {
				continue;
			}

			if (user.do_import) {
				return user.rocketId;
			}

			if (user.is_bot) {
				return 'rocket.cat';
			}
		}
	}

	convertSlackMessageToRocketChat(message) {
		if (message) {
			message = message.replace(/<!everyone>/g, '@all');
			message = message.replace(/<!channel>/g, '@all');
			message = message.replace(/<!here>/g, '@here');
			message = message.replace(/&gt;/g, '>');
			message = message.replace(/&lt;/g, '<');
			message = message.replace(/&amp;/g, '&');
			message = message.replace(/:simple_smile:/g, ':smile:');
			message = message.replace(/:memo:/g, ':pencil:');
			message = message.replace(/:piggy:/g, ':pig:');
			message = message.replace(/:uk:/g, ':gb:');
			message = message.replace(/<(http[s]?:[^>|]*)>/g, '$1');
			message = message.replace(/<(http[s]?:[^|]*)\|([^>]*)>/g, '[$2]($1)');
			message = message.replace(/<#([^|]*)\|([^>]*)>/g, '#$2');

			for (const userReplace of Array.from(this.userTags)) {
				message = message.replace(userReplace.slack, userReplace.rocket);
				message = message.replace(userReplace.slackLong, userReplace.rocket);
			}
		} else {
			message = '';
		}

		return message;
	}

	convertSlackFileToPendingFile(file) {
		return {
			downloadUrl: file.url_private_download,
			id: file.id,
			size: file.size,
			name: file.name,
			external: file.is_external,
			source: 'slack',
			original: {
				...file,
			},
		};
	}

	convertMessageAttachments(attachments) {
		if (!attachments || !attachments.length) {
			return attachments;
		}

		return attachments.map((attachment) => ({
			...attachment,
			text: this.convertSlackMessageToRocketChat(attachment.text),
			title: this.convertSlackMessageToRocketChat(attachment.title),
			fallback: this.convertSlackMessageToRocketChat(attachment.fallback),
		}));
	}
}
