import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import {
	Base,
	ProgressStep,
	Selection,
	SelectionChannel,
	SelectionUser,
} from '../../importer/server';
import { RocketChatFile } from '../../file';
import { getAvatarUrlFromUsername } from '../../utils';
import { Users, Rooms, Messages } from '../../models';
import { sendMessage } from '../../lib';

import _ from 'underscore';

export class SlackImporter extends Base {
	constructor(info) {
		super(info);
		this.userTags = [];
		this.bots = {};
	}

	prepare(dataURI, sentContentType, fileName) {
		super.prepare(dataURI, sentContentType, fileName);

		const { image } = RocketChatFile.dataURIParse(dataURI);
		const zip = new this.AdmZip(new Buffer(image, 'base64'));
		const zipEntries = zip.getEntries();

		let tempChannels = [];
		let tempDMCs = [];
		let tempUsers = [];
		const tempMessages = {};

		zipEntries.forEach((entry) => {
			//ignore mac specific folders
			if (entry.entryName.indexOf('__MACOSX') > -1) {
				return this.logger.debug(`Ignoring the file: ${ entry.entryName }`);
			}
			//parse public channel data
			if (entry.entryName === 'channels.json') {
				super.updateProgress(ProgressStep.PREPARING_CHANNELS);
				let tempJSONChannelArray = JSON.parse(entry.getData().toString()).filter((channel) => channel.creator != null);
				tempJSONChannelArray.forEach((channel) => channel.is_private = false);
				tempChannels = (tempChannels) ? tempChannels.concat(tempJSONChannelArray) : tempJSONChannelArray;
				return;
			}
			//parse group data (private Channels)
			if (entry.entryName === 'groups.json') {
				super.updateProgress(ProgressStep.PREPARING_CHANNELS);
				let tempJSONGrouplArray = JSON.parse(entry.getData().toString()).filter((channel) => channel.creator != null);
				tempJSONGrouplArray.forEach((group) => group.is_private = true);
				tempChannels = (tempChannels) ? tempChannels.concat(tempJSONGrouplArray) : tempJSONGrouplArray;
				return;
			}
			//parse direct messages data
			if (entry.entryName === 'dms.json') {
				super.updateProgress(ProgressStep.PREPARING_DMS);
				tempDMCs = JSON.parse(entry.getData().toString());
				return;
			}
			//ToDo parse Multi-user-direct messages data


			if (entry.entryName === 'users.json') {
				super.updateProgress(ProgressStep.PREPARING_USERS);
				tempUsers = JSON.parse(entry.getData().toString());

				tempUsers.forEach((user) => {
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
		// if someone tries to import a several thousands of users instances
		const usersId = this.collection.insert({ import: this.importRecord._id, importer: this.name, type: 'users', users: tempUsers });
		this.users = this.collection.findOne(usersId);
		this.updateRecord({ 'count.users': tempUsers.length });
		this.addCountToTotal(tempUsers.length);

		// Insert the channels records.
		const channelsId = this.collection.insert({ import: this.importRecord._id, importer: this.name, type: 'channels', channels: tempChannels });
		this.channels = this.collection.findOne(channelsId);
		this.updateRecord({ 'count.channels': tempChannels.length });
		this.addCountToTotal(tempChannels.length);

		// if(tempDMCs){
		// 	// Insert the DMs records.
		// 	const dmsId = this.collection.insert({ import: this.importRecord._id, importer: this.name, type: 'dms', channels: tempDMs });
		// 	this.dms = this.collection.findOne(dmsId);
		// 	this.updateRecord({ 'count.dms': tempDMs.length });
		// 	this.addCountToTotal(tempDMs.length);
		// }

		// Insert the messages records
		super.updateProgress(ProgressStep.PREPARING_MESSAGES);

		let messagesCount = 0;
		Object.keys(tempMessages).forEach((channel) => {
			const messagesObj = tempMessages[channel];
			this.messages[channel] = this.messages[channel] || {};

			Object.keys(messagesObj).forEach((date) => {
				const msgs = messagesObj[date];
				messagesCount += msgs.length;
				this.updateRecord({ messagesstatus: `${ channel }/${ date }` });
				if (Base.getBSONSize(msgs) > Base.getMaxBSONSize()) {
					const tmp = Base.getBSONSafeArraysFromAnArray(msgs);
					Object.keys(tmp).forEach((i) => {
						const splitMsg = tmp[i];
						const messagesId = this.collection.insert({ import: this.importRecord._id, importer: this.name, type: 'messages', name: `${ channel }/${ date }.${ i }`, messages: splitMsg });
						this.messages[channel][`${ date }.${ i }`] = this.collection.findOne(messagesId);
					});
				} else {
					const messagesId = this.collection.insert({ import: this.importRecord._id, importer: this.name, type: 'messages', name: `${ channel }/${ date }`, messages: msgs });
					this.messages[channel][date] = this.collection.findOne(messagesId);
				}
			});
		});

		this.updateRecord({ 'count.messages': messagesCount, messagesstatus: null });
		this.addCountToTotal(messagesCount);

		if ([tempUsers.length, tempChannels.length, messagesCount].some((e) => e === 0)) {
			this.logger.warn(`The loaded users count ${ tempUsers.length }, the loaded channels ${ tempChannels.length }, and the loaded messages ${ messagesCount }`);
			console.log(`The loaded users count ${ tempUsers.length }, the loaded channels ${ tempChannels.length }, and the loaded messages ${ messagesCount }`);
			super.updateProgress(ProgressStep.ERROR);
			return this.getProgress();
		}

		const selectionUsers = tempUsers.map((user) => new SelectionUser(user.id, user.name, user.profile.email, user.deleted, user.is_bot, !user.is_bot));
		const selectionChannels = tempChannels.map((channel) => new SelectionChannel(channel.id, channel.name, channel.is_archived, true, channel.is_private));



		const selectionMessages = this.importRecord.count.messages;
		super.updateProgress(ProgressStep.USER_SELECTION);

		return new Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
	}


	startImport(importSelection) {
		super.startImport(importSelection);
		const start = Date.now();

		//assign import-flag for users (local copy of the users collection) and update the mongo collection
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

		//assign import-flag for channels (local copy of the channels collection)  and update mongo collection
		Object.keys(importSelection.channels).forEach((key) => {
			const channel = importSelection.channels[key];
			Object.keys(this.channels.channels).forEach((k) => {
				const c = this.channels.channels[k];
				if (c.id === channel.channel_id) {
					c.do_import = channel.do_import;
				}
			});
		});
		this.collection.update({ _id: this.channels._id }, { $set: { channels: this.channels.channels } });


		const startedByUserId = Meteor.userId();
		Meteor.defer(() => {
			try {
				//user import
				super.updateProgress(ProgressStep.IMPORTING_USERS);
				this.users.users.forEach((user) => {
					if (!user.do_import) {
						return;
					}

					Meteor.runAsUser(startedByUserId, () => {
						const existantUser = Users.findOneByEmailAddress(user.profile.email) || Users.findOneByUsername(user.name);
						if (existantUser) {
							user.rocketId = existantUser._id;
							Users.update({ _id: user.rocketId }, { $addToSet: { importIds: user.id } });
							this.userTags.push({
								slack: `<@${ user.id }>`,
								slackLong: `<@${ user.id }|${ user.name }>`,
								rocket: `@${ existantUser.username }`,
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

							Users.update({ _id: userId }, { $addToSet: { importIds: user.id } });

							if (user.profile.real_name) {
								Users.setName(userId, user.profile.real_name);
							}

							// Deleted users are 'inactive' users in Rocket.Chat
							if (user.deleted) {
								Meteor.call('setUserActiveStatus', userId, false);
							}

							user.rocketId = userId;
							this.userTags.push({
								slack: `<@${ user.id }>`,
								slackLong: `<@${ user.id }|${ user.name }>`,
								rocket: `@${ user.name }`,
							});
						}

						this.addCountCompleted(1);
					});
				});
				this.collection.update({ _id: this.users._id }, { $set: { users: this.users.users } });

				//channel import
				super.updateProgress(ProgressStep.IMPORTING_CHANNELS);
				this.channels.channels.forEach((channel) => {
					if (!channel.do_import) {
						return;
					}

					Meteor.runAsUser (startedByUserId, () => {

						const existantRoom = Rooms.findOneByName(channel.name);

						if (existantRoom || channel.is_general) {
							if (channel.is_general && existantRoom && channel.name !== existantRoom.name) {
								Meteor.call('saveRoomSettings', 'GENERAL', 'roomName', channel.name);
							}

							channel.rocketId = channel.is_general ? 'GENERAL' : existantRoom._id;
							Rooms.update({ _id: channel.rocketId }, { $addToSet: { importIds: channel.id } });
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
							this.users.users.forEach((user) => {
								if (user.id === channel.creator && user.do_import) {
									userId = user.rocketId;
								}
							});
							Meteor.runAsUser(userId, () => {
								const returned = channel.is_private ? Meteor.call('createPrivateGroup', channel.name, users) : Meteor.call('createChannel', channel.name, users);
								channel.rocketId = returned.rid;
							});

							// @TODO implement model specific function
							const roomUpdate = {
								ts: new Date(channel.created * 1000),
							};
							if (!_.isEmpty(channel.topic && channel.topic.value)) {
								roomUpdate.topic = channel.topic.value;
							}
							if (!_.isEmpty(channel.purpose && channel.purpose.value)) {
								roomUpdate.description = channel.purpose.value;
							}
							Rooms.update({ _id: channel.rocketId }, { $set: roomUpdate, $addToSet: { importIds: channel.id } });
						}
						this.addCountCompleted(1);
					});
				});
				this.collection.update({ _id: this.channels._id }, { $set: { channels: this.channels.channels } });

				const missedTypes = {};
				const ignoreTypes = { bot_add: true, file_comment: true, file_mention: true };
				super.updateProgress(ProgressStep.IMPORTING_MESSAGES);

				//importing messages...
				Object.keys(this.messages).forEach((channel) => {
					const messagesObj = this.messages[channel];

					Meteor.runAsUser(startedByUserId, () => {
						const slackChannel = this.getSlackChannelFromName(channel);
						if (!slackChannel || !slackChannel.do_import) { return; }
						const room = Rooms.findOneById(slackChannel.rocketId, { fields: { usernames: 1, t: 1, name: 1 } });
						Object.keys(messagesObj).forEach((date) => {
							const msgs = messagesObj[date];
							msgs.messages.forEach((message) => {
								this.updateRecord({ messagesstatus: `${ channel }/${ date }.${ msgs.messages.length }` });
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

										reaction.users.forEach((u) => {
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
									if (message.files && message.files[0].url_private_download !== undefined) {
										const msgObj = {
											...msgDataDefaults,
											msg: this.convertSlackMessageToRocketChat(message.files[0].url_private_download),
										};
										sendMessage(this.getRocketUser(message.user), msgObj, room, true);
									}
									if (message.subtype) {
										if (message.subtype === 'channel_join') {
											if (this.getRocketUser(message.user)) {
												Messages.createUserJoinWithRoomIdAndUser(room._id, this.getRocketUser(message.user), msgDataDefaults);
											}
										} else if (message.subtype === 'channel_leave') {
											if (this.getRocketUser(message.user)) {
												Messages.createUserLeaveWithRoomIdAndUser(room._id, this.getRocketUser(message.user), msgDataDefaults);
											}
										} else if (message.subtype === 'me_message') {
											const msgObj = {
												...msgDataDefaults,
												msg: `_${ this.convertSlackMessageToRocketChat(message.text) }_`,
											};
											sendMessage(this.getRocketUser(message.user), msgObj, room, true);
										} else if (message.subtype === 'bot_message' || message.subtype === 'slackbot_response') {
											const botUser = Users.findOneById('rocket.cat', { fields: { username: 1 } });
											const botUsername = this.bots[message.bot_id] ? this.bots[message.bot_id].name : message.username;
											const msgObj = {
												...msgDataDefaults,
												msg: this.convertSlackMessageToRocketChat(message.text),
												rid: room._id,
												bot: true,
												attachments: message.attachments,
												username: botUsername || undefined,
											};

											if (message.edited) {
												msgObj.editedAt = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
												const editedBy = this.getRocketUser(message.edited.user);
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
											sendMessage(botUser, msgObj, room, true);
										} else if (message.subtype === 'channel_purpose') {
											if (this.getRocketUser(message.user)) {
												Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', room._id, message.purpose, this.getRocketUser(message.user), msgDataDefaults);
											}
										} else if (message.subtype === 'channel_topic') {
											if (this.getRocketUser(message.user)) {
												Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, message.topic, this.getRocketUser(message.user), msgDataDefaults);
											}
										} else if (message.subtype === 'channel_name') {
											if (this.getRocketUser(message.user)) {
												Messages.createRoomRenamedWithRoomIdRoomNameAndUser(room._id, message.name, this.getRocketUser(message.user), msgDataDefaults);
											}
										} else if (message.subtype === 'pinned_item') {
											if (message.attachments) {
												const msgObj = {
													...msgDataDefaults,
													attachments: [{
														text: this.convertSlackMessageToRocketChat(message.attachments[0].text),
														author_name : message.attachments[0].author_subname,
														author_icon : getAvatarUrlFromUsername(message.attachments[0].author_subname),
													}],
												};
												Messages.createWithTypeRoomIdMessageAndUser('message_pinned', room._id, '', this.getRocketUser(message.user), msgObj);
											} else {
												// TODO: make this better
												this.logger.debug('Pinned item with no attachment, needs work.');
												// RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser 'message_pinned', room._id, '', @getRocketUser(message.user), msgDataDefaults
											}
										} else if (message.subtype === 'file_share') {
											if (message.file && message.file.url_private_download !== undefined) {
												const details = {
													message_id: `slack-${ message.ts.replace(/\./g, '-') }`,
													name: message.file.name,
													size: message.file.size,
													type: message.file.mimetype,
													rid: room._id,
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
													username: user.username,
												},
											};

											if (message.edited) {
												msgObj.editedAt = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
												const editedBy = this.getRocketUser(message.edited.user);
												if (editedBy) {
													msgObj.editedBy = {
														_id: editedBy._id,
														username: editedBy.username,
													};
												}
											}

											try {
												sendMessage(this.getRocketUser(message.user), msgObj, room, true);
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

				super.updateProgress(ProgressStep.FINISHING);

				this.channels.channels.forEach((channel) => {
					if (channel.do_import && channel.is_archived) {
						Meteor.runAsUser(startedByUserId, function() {
							Meteor.call('archiveRoom', channel.rocketId);
						});
					}
				});
				super.updateProgress(ProgressStep.DONE);

				this.logger.log(`Import took ${ Date.now() - start } milliseconds.`);
			} catch (e) {
				this.logger.error(e);
				super.updateProgress(ProgressStep.ERROR);
			}
		});

		return this.getProgress();
	}

	getSlackChannelFromName(channelName) {
		return this.channels.channels.find((channel) => channel.name === channelName);
	}

	getRocketUser(slackId) {
		const user = this.users.users.find((user) => user.id === slackId);

		if (user) {
			return Users.findOneById(user.rocketId, { fields: { username: 1, name: 1 } });
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
		const selectionUsers = this.users.users.map((user) => new SelectionUser(user.id, user.name, user.profile.email, user.deleted, user.is_bot, !user.is_bot));
		const selectionChannels = this.channels.channels.map((channel) => new SelectionChannel(channel.id, channel.name, channel.is_archived, true, false));
		return new Selection(this.name, selectionUsers, selectionChannels, this.importRecord.count.messages);
	}
}
