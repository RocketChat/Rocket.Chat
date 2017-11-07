/* globals Importer */
import _ from 'underscore';

Importer.Slack = class extends Importer.Base {
	constructor(name, descriptionI18N, mimeType) {
		super(name, descriptionI18N, mimeType);
		this.userTags = [];
		this.bots = {};
		this.logger.debug('Constructed a new Slack Importer.');
	}

	prepare(dataURI, sentContentType, fileName) {
		super.prepare(dataURI, sentContentType, fileName);

		const { image } = RocketChatFile.dataURIParse(dataURI);
		const zip = new this.AdmZip(new Buffer(image, 'base64'));
		const zipEntries = zip.getEntries();

		let tempChannels = [];
		let tempUsers = [];
		const tempMessages = {};

		zipEntries.forEach(entry => {
			if (entry.entryName.indexOf('__MACOSX') > -1) {
				return this.logger.debug(`Ignoring the file: ${ entry.entryName }`);
			}

			if (entry.entryName === 'channels.json') {
				this.updateProgress(Importer.ProgressStep.PREPARING_CHANNELS);
				tempChannels = JSON.parse(entry.getData().toString()).filter(channel => channel.creator != null);
				return;
			}

			if (entry.entryName === 'users.json') {
				this.updateProgress(Importer.ProgressStep.PREPARING_USERS);
				tempUsers = JSON.parse(entry.getData().toString());

				tempUsers.forEach(user => {
					if (user.is_bot) {
						this.bots[user.profile.bot_id] = user;
					}
				});

				return;
			}

			if (!entry.isDirectory && entry.entryName.indexOf('/') > -1) {
				const item = entry.entryName.split('/');
				const channelName = item[0];
				const msgGroupData = item[1].split('.')[0];
				tempMessages[channelName] = tempMessages[channelName] || {};

				try {
					tempMessages[channelName][msgGroupData] = JSON.parse(entry.getData().toString());
				} catch (error) {
					this.logger.warn(`${ entry.entryName } is not a valid JSON file! Unable to import it.`);
				}
			}
		});

		// Insert the users record, eventually this might have to be split into several ones as well
		// if someone tries to import a several thousands users instance
		const usersId = this.collection.insert({ 'import': this.importRecord._id, 'importer': this.name, 'type': 'users', 'users': tempUsers });
		this.users = this.collection.findOne(usersId);
		this.updateRecord({ 'count.users': tempUsers.length });
		this.addCountToTotal(tempUsers.length);

		// Insert the channels records.
		const channelsId = this.collection.insert({ 'import': this.importRecord._id, 'importer': this.name, 'type': 'channels', 'channels': tempChannels });
		this.channels = this.collection.findOne(channelsId);
		this.updateRecord({ 'count.channels': tempChannels.length });
		this.addCountToTotal(tempChannels.length);

		// Insert the messages records
		this.updateProgress(Importer.ProgressStep.PREPARING_MESSAGES);

		let messagesCount = 0;
		Object.keys(tempMessages).forEach(channel => {
			const messagesObj = tempMessages[channel];
			this.messages[channel] = this.messages[channel] || {};

			Object.keys(messagesObj).forEach(date => {
				const msgs = messagesObj[date];
				messagesCount += msgs.length;
				this.updateRecord({ 'messagesstatus': `${ channel }/${ date }` });
				if (Importer.Base.getBSONSize(msgs) > Importer.Base.MaxBSONSize) {
					const tmp = Importer.Base.getBSONSafeArraysFromAnArray(msgs);
					Object.keys(tmp).forEach(i => {
						const splitMsg = tmp[i];
						const messagesId = this.collection.insert({ 'import': this.importRecord._id, 'importer': this.name, 'type': 'messages', 'name': `${ channel }/${ date }.${ i }`, 'messages': splitMsg });
						this.messages[channel][`${ date }.${ i }`] = this.collection.findOne(messagesId);
					});
				} else {
					const messagesId = this.collection.insert({ 'import': this.importRecord._id, 'importer': this.name, 'type': 'messages', 'name': `${ channel }/${ date }`, 'messages': msgs });
					this.messages[channel][date] = this.collection.findOne(messagesId);
				}
			});
		});

		this.updateRecord({ 'count.messages': messagesCount, 'messagesstatus': null });
		this.addCountToTotal(messagesCount);
		if ([tempUsers.length, tempChannels.length, messagesCount].some(e => e === 0)) {
			this.logger.warn(`The loaded users count ${ tempUsers.length }, the loaded channels ${ tempChannels.length }, and the loaded messages ${ messagesCount }`);
			console.log(`The loaded users count ${ tempUsers.length }, the loaded channels ${ tempChannels.length }, and the loaded messages ${ messagesCount }`);
			this.updateProgress(Importer.ProgressStep.ERROR);
			return this.getProgress();
		}
		const selectionUsers = tempUsers.map(user => new Importer.SelectionUser(user.id, user.name, user.profile.email, user.deleted, user.is_bot, !user.is_bot));
		const selectionChannels = tempChannels.map(channel => new Importer.SelectionChannel(channel.id, channel.name, channel.is_archived, true, false));
		const selectionMessages = this.importRecord.count.messages;
		this.updateProgress(Importer.ProgressStep.USER_SELECTION);
		return new Importer.Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
	}
	startImport(importSelection) {
		super.startImport(importSelection);
		const start = Date.now();

		Object.keys(importSelection.users).forEach(key => {
			const user = importSelection.users[key];
			Object.keys(this.users.users).forEach(k => {
				const u = this.users.users[k];
				if (u.id === user.user_id) {
					u.do_import = user.do_import;
				}
			});
		});
		this.collection.update({ _id: this.users._id }, { $set: { 'users': this.users.users }});

		Object.keys(importSelection.channels).forEach(key => {
			const channel = importSelection.channels[key];
			Object.keys(this.channels.channels).forEach(k => {
				const c = this.channels.channels[k];
				if (c.id === channel.channel_id) {
					c.do_import = channel.do_import;
				}
			});
		});
		this.collection.update({ _id: this.channels._id }, { $set: { 'channels': this.channels.channels }});

		const startedByUserId = Meteor.userId();
		Meteor.defer(() => {
			try {
				this.updateProgress(Importer.ProgressStep.IMPORTING_USERS);
				this.users.users.forEach(user => {
					if (!user.do_import) {
						return;
					}

					Meteor.runAsUser(startedByUserId, () => {
						const existantUser = RocketChat.models.Users.findOneByEmailAddress(user.profile.email) || RocketChat.models.Users.findOneByUsername(user.name);
						if (existantUser) {
							user.rocketId = existantUser._id;
							RocketChat.models.Users.update({ _id: user.rocketId }, { $addToSet: { importIds: user.id } });
							this.userTags.push({
								slack: `<@${ user.id }>`,
								slackLong: `<@${ user.id }|${ user.name }>`,
								rocket: `@${ existantUser.username }`
							});
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

							RocketChat.models.Users.update({ _id: userId }, { $addToSet: { importIds: user.id } });

							if (user.profile.real_name) {
								RocketChat.models.Users.setName(userId, user.profile.real_name);
							}

							//Deleted users are 'inactive' users in Rocket.Chat
							if (user.deleted) {
								Meteor.call('setUserActiveStatus', userId, false);
							}

							user.rocketId = userId;
							this.userTags.push({
								slack: `<@${ user.id }>`,
								slackLong: `<@${ user.id }|${ user.name }>`,
								rocket: `@${ user.name }`
							});
						}

						this.addCountCompleted(1);
					});
				});
				this.collection.update({ _id: this.users._id }, { $set: { 'users': this.users.users }});

				this.updateProgress(Importer.ProgressStep.IMPORTING_CHANNELS);
				this.channels.channels.forEach(channel => {
					if (!channel.do_import) {
						return;
					}

					Meteor.runAsUser (startedByUserId, () => {
						const existantRoom = RocketChat.models.Rooms.findOneByName(channel.name);
						if (existantRoom || channel.is_general) {
							if (channel.is_general && existantRoom && channel.name !== existantRoom.name) {
								Meteor.call('saveRoomSettings', 'GENERAL', 'roomName', channel.name);
							}

							channel.rocketId = channel.is_general ? 'GENERAL' : existantRoom._id;
							RocketChat.models.Rooms.update({ _id: channel.rocketId }, { $addToSet: { importIds: channel.id } });
						} else {
							const users = channel.members
								.reduce((ret, member) => {
									if (member !== channel.creator) {
										const user = this.getRocketUser(member);
										if (user && user.username) {
											ret.push(user.username);
										}
									}
									return ret;
								}, []);
							let userId = startedByUserId;
							this.users.users.forEach(user => {
								if (user.id === channel.creator && user.do_import) {
									userId = user.rocketId;
								}
							});
							Meteor.runAsUser(userId, () => {
								const returned = Meteor.call('createChannel', channel.name, users);
								channel.rocketId = returned.rid;
							});

							// @TODO implement model specific function
							const roomUpdate = {
								ts: new Date(channel.created * 1000)
							};
							if (!_.isEmpty(channel.topic && channel.topic.value)) {
								roomUpdate.topic = channel.topic.value;
							}
							if (!_.isEmpty(channel.purpose && channel.purpose.value)) {
								roomUpdate.description = channel.purpose.value;
							}
							RocketChat.models.Rooms.update({ _id: channel.rocketId }, { $set: roomUpdate, $addToSet: { importIds: channel.id } });
						}
						this.addCountCompleted(1);
					});
				});
				this.collection.update({ _id: this.channels._id }, { $set: { 'channels': this.channels.channels }});

				const missedTypes = {};
				const ignoreTypes = { 'bot_add': true, 'file_comment': true, 'file_mention': true };
				this.updateProgress(Importer.ProgressStep.IMPORTING_MESSAGES);
				Object.keys(this.messages).forEach(channel => {
					const messagesObj = this.messages[channel];

					Meteor.runAsUser(startedByUserId, () =>{
						const slackChannel = this.getSlackChannelFromName(channel);
						if (!slackChannel || !slackChannel.do_import) { return; }
						const room = RocketChat.models.Rooms.findOneById(slackChannel.rocketId, { fields: { usernames: 1, t: 1, name: 1 } });
						Object.keys(messagesObj).forEach(date => {
							const msgs = messagesObj[date];
							msgs.messages.forEach(message => {
								this.updateRecord({ 'messagesstatus': `${ channel }/${ date }.${ msgs.messages.length }` });
								const msgDataDefaults ={
									_id: `slack-${ slackChannel.id }-${ message.ts.replace(/\./g, '-') }`,
									ts: new Date(parseInt(message.ts.split('.')[0]) * 1000)
								};

								// Process the reactions
								if (message.reactions && message.reactions.length > 0) {
									msgDataDefaults.reactions = {};

									message.reactions.forEach(reaction => {
										msgDataDefaults.reactions[reaction.name] = { usernames: [] };

										reaction.users.forEach(u => {
											const rcUser = this.getRocketUser(u);
											if (!rcUser) { return; }

											msgDataDefaults.reactions[reaction.name].usernames.push(rcUser.username);
										});

										if (msgDataDefaults.reactions[reaction.name].usernames.length === 0) {
											delete msgDataDefaults.reactions[reaction.name];
										}
									});
								}

								if (message.type === 'message') {
									if (message.subtype) {
										if (message.subtype === 'channel_join') {
											if (this.getRocketUser(message.user)) {
												RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(room._id, this.getRocketUser(message.user), msgDataDefaults);
											}
										} else if (message.subtype === 'channel_leave') {
											if (this.getRocketUser(message.user)) {
												RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(room._id, this.getRocketUser(message.user), msgDataDefaults);
											}
										} else if (message.subtype === 'me_message') {
											const msgObj = {
												...msgDataDefaults,
												msg: `_${ this.convertSlackMessageToRocketChat(message.text) }_`
											};
											RocketChat.sendMessage(this.getRocketUser(message.user), msgObj, room, true);
										} else if (message.subtype === 'bot_message' || message.subtype === 'slackbot_response') {
											const botUser = RocketChat.models.Users.findOneById('rocket.cat', { fields: { username: 1 }});
											const botUsername = this.bots[message.bot_id] ? this.bots[message.bot_id].name : message.username;
											const msgObj = {
												...msgDataDefaults,
												msg: this.convertSlackMessageToRocketChat(message.text),
												rid: room._id,
												bot: true,
												attachments: message.attachments,
												username: botUsername || undefined
											};

											if (message.edited) {
												msgObj.editedAt = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
												const editedBy = this.getRocketUser(message.edited.user);
												if (editedBy) {
													msgObj.editedBy = {
														_id: editedBy._id,
														username: editedBy.username
													};
												}
											}

											if (message.icons) {
												msgObj.emoji = message.icons.emoji;
											}
											RocketChat.sendMessage(botUser, msgObj, room, true);
										} else if (message.subtype === 'channel_purpose') {
											if (this.getRocketUser(message.user)) {
												RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', room._id, message.purpose, this.getRocketUser(message.user), msgDataDefaults);
											}
										} else if (message.subtype === 'channel_topic') {
											if (this.getRocketUser(message.user)) {
												RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, message.topic, this.getRocketUser(message.user), msgDataDefaults);
											}
										} else if (message.subtype === 'channel_name') {
											if (this.getRocketUser(message.user)) {
												RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(room._id, message.name, this.getRocketUser(message.user), msgDataDefaults);
											}
										} else if (message.subtype === 'pinned_item') {
											if (message.attachments) {
												const msgObj = {
													...msgDataDefaults,
													attachments: [{
														'text': this.convertSlackMessageToRocketChat(message.attachments[0].text),
														'author_name' : message.attachments[0].author_subname,
														'author_icon' : getAvatarUrlFromUsername(message.attachments[0].author_subname)
													}]
												};
												RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('message_pinned', room._id, '', this.getRocketUser(message.user), msgObj);
											} else {
												//TODO: make this better
												this.logger.debug('Pinned item with no attachment, needs work.');
												//RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser 'message_pinned', room._id, '', @getRocketUser(message.user), msgDataDefaults
											}
										} else if (message.subtype === 'file_share') {
											if (message.file && message.file.url_private_download !== undefined) {
												const details = {
													message_id: `slack-${ message.ts.replace(/\./g, '-') }`,
													name: message.file.name,
													size: message.file.size,
													type: message.file.mimetype,
													rid: room._id
												};
												this.uploadFile(details, message.file.url_private_download, this.getRocketUser(message.user), room, new Date(parseInt(message.ts.split('.')[0]) * 1000));
											}
										} else if (!missedTypes[message.subtype] && !ignoreTypes[message.subtype]) {
											missedTypes[message.subtype] = message;
										}
									} else {
										const user = this.getRocketUser(message.user);
										if (user) {
											const msgObj = {
												...msgDataDefaults,
												msg: this.convertSlackMessageToRocketChat(message.text),
												rid: room._id,
												u: {
													_id: user._id,
													username: user.username
												}
											};

											if (message.edited) {
												msgObj.editedAt = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
												const editedBy = this.getRocketUser(message.edited.user);
												if (editedBy) {
													msgObj.editedBy = {
														_id: editedBy._id,
														username: editedBy.username
													};
												}
											}

											try {
												RocketChat.sendMessage(this.getRocketUser(message.user), msgObj, room, true);
											} catch (e) {
												this.logger.warn(`Failed to import the message: ${ msgDataDefaults._id }`);
											}
										}
									}
								}

								this.addCountCompleted(1);
							});
						});
					});
				});

				if (!_.isEmpty(missedTypes)) {
					console.log('Missed import types:', missedTypes);
				}

				this.updateProgress(Importer.ProgressStep.FINISHING);

				this.channels.channels.forEach(channel => {
					if (channel.do_import && channel.is_archived) {
						Meteor.runAsUser(startedByUserId, function() {
							Meteor.call('archiveRoom', channel.rocketId);
						});
					}
				});
				this.updateProgress(Importer.ProgressStep.DONE);

				const timeTook = Date.now() - start;

				this.logger.log(`Import took ${ timeTook } milliseconds.`);
			} catch (e) {
				this.logger.error(e);
				this.updateProgress(Importer.ProgressStep.ERROR);
			}
		});

		return this.getProgress();
	}
	getSlackChannelFromName(channelName) {
		return this.channels.channels.find(channel => channel.name === channelName);
	}
	getRocketUser(slackId) {
		const user = this.users.users.find(user => user.id === slackId);
		if (user) {
			return RocketChat.models.Users.findOneById(user.rocketId, { fields: { username: 1, name: 1 }});
		}
	}
	convertSlackMessageToRocketChat(message) {
		if (message != null) {
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
			message = message.replace(/<(http[s]?:[^>]*)>/g, '$1');
			for (const userReplace of Array.from(this.userTags)) {
				message = message.replace(userReplace.slack, userReplace.rocket);
				message = message.replace(userReplace.slackLong, userReplace.rocket);
			}
		} else {
			message = '';
		}
		return message;
	}
	getSelection() {
		const selectionUsers = this.users.users.map(user => new Importer.SelectionUser(user.id, user.name, user.profile.email, user.deleted, user.is_bot, !user.is_bot));
		const selectionChannels = this.channels.channels.map(channel => new Importer.SelectionChannel(channel.id, channel.name, channel.is_archived, true, false));
		const selectionMessages = this.importRecord.count.messages;
		return new Importer.Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
	}
};
