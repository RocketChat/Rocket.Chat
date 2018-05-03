import {
	Base,
	ProgressStep,
	Selection,
	SelectionChannel,
	SelectionUser
} from 'meteor/rocketchat:importer';

import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';

import 'moment-timezone';

export class HipChatImporter extends Base {
	constructor(info) {
		super(info);

		this.userTags = [];
		this.roomPrefix = 'hipchat_export/rooms/';
		this.usersPrefix = 'hipchat_export/users/';
	}

	prepare(dataURI, sentContentType, fileName) {
		super.prepare(dataURI, sentContentType, fileName);
		const image = RocketChatFile.dataURIParse(dataURI).image;
		// const contentType = ref.contentType;
		const zip = new this.AdmZip(new Buffer(image, 'base64'));
		const zipEntries = zip.getEntries();
		const tempRooms = [];
		let tempUsers = [];
		const tempMessages = {};

		zipEntries.forEach(entry => {
			if (entry.entryName.indexOf('__MACOSX') > -1) {
				this.logger.debug(`Ignoring the file: ${ entry.entryName }`);
			}
			if (entry.isDirectory) {
				return;
			}
			if (entry.entryName.indexOf(this.roomPrefix) > -1) {
				let roomName = entry.entryName.split(this.roomPrefix)[1];
				if (roomName === 'list.json') {
					super.updateProgress(ProgressStep.PREPARING_CHANNELS);
					const tempRooms = JSON.parse(entry.getData().toString()).rooms;
					tempRooms.forEach(room => {
						room.name = s.slugify(room.name);
					});
				} else if (roomName.indexOf('/') > -1) {
					const item = roomName.split('/');
					roomName = s.slugify(item[0]);
					const msgGroupData = item[1].split('.')[0];
					if (!tempMessages[roomName]) {
						tempMessages[roomName] = {};
					}
					try {
						return tempMessages[roomName][msgGroupData] = JSON.parse(entry.getData().toString());
					} catch (error) {
						return this.logger.warn(`${ entry.entryName } is not a valid JSON file! Unable to import it.`);
					}
				}
			} else if (entry.entryName.indexOf(this.usersPrefix) > -1) {
				const usersName = entry.entryName.split(this.usersPrefix)[1];
				if (usersName === 'list.json') {
					super.updateProgress(ProgressStep.PREPARING_USERS);
					return tempUsers = JSON.parse(entry.getData().toString()).users;
				} else {
					return this.logger.warn(`Unexpected file in the ${ this.name } import: ${ entry.entryName }`);
				}
			}
		});
		const usersId = this.collection.insert({
			'import': this.importRecord._id,
			'importer': this.name,
			'type': 'users',
			'users': tempUsers
		});
		this.users = this.collection.findOne(usersId);
		this.updateRecord({
			'count.users': tempUsers.length
		});
		this.addCountToTotal(tempUsers.length);
		const channelsId = this.collection.insert({
			'import': this.importRecord._id,
			'importer': this.name,
			'type': 'channels',
			'channels': tempRooms
		});
		this.channels = this.collection.findOne(channelsId);
		this.updateRecord({
			'count.channels': tempRooms.length
		});
		this.addCountToTotal(tempRooms.length);
		super.updateProgress(ProgressStep.PREPARING_MESSAGES);
		let messagesCount = 0;
		Object.keys(tempMessages).forEach(channel => {
			const messagesObj = tempMessages[channel];
			this.messages[channel] = this.messages[channel] || {};
			Object.keys(messagesObj).forEach(date => {
				const msgs = messagesObj[date];
				messagesCount += msgs.length;
				this.updateRecord({
					'messagesstatus': `${ channel }/${ date }`
				});
				if (Base.getBSONSize(msgs) > Base.getMaxBSONSize()) {
					Base.getBSONSafeArraysFromAnArray(msgs).forEach((splitMsg, i) => {
						const messagesId = this.collection.insert({
							'import': this.importRecord._id,
							'importer': this.name,
							'type': 'messages',
							'name': `${ channel }/${ date }.${ i }`,
							'messages': splitMsg
						});
						this.messages[channel][`${ date }.${ i }`] = this.collection.findOne(messagesId);
					});
				} else {
					const messagesId = this.collection.insert({
						'import': this.importRecord._id,
						'importer': this.name,
						'type': 'messages',
						'name': `${ channel }/${ date }`,
						'messages': msgs
					});
					this.messages[channel][date] = this.collection.findOne(messagesId);
				}
			});
		});
		this.updateRecord({
			'count.messages': messagesCount,
			'messagesstatus': null
		});
		this.addCountToTotal(messagesCount);
		if (tempUsers.length === 0 || tempRooms.length === 0 || messagesCount === 0) {
			this.logger.warn(`The loaded users count ${ tempUsers.length }, the loaded channels ${ tempRooms.length }, and the loaded messages ${ messagesCount }`);
			super.updateProgress(ProgressStep.ERROR);
			return this.getProgress();
		}
		const selectionUsers = tempUsers.map(function(user) {
			return new SelectionUser(user.user_id, user.name, user.email, user.is_deleted, false, !user.is_bot);
		});
		const selectionChannels = tempRooms.map(function(room) {
			return new SelectionChannel(room.room_id, room.name, room.is_archived, true, false);
		});
		const selectionMessages = this.importRecord.count.messages;
		super.updateProgress(ProgressStep.USER_SELECTION);
		return new Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
	}

	startImport(importSelection) {
		super.startImport(importSelection);
		const start = Date.now();

		importSelection.users.forEach(user => {
			this.users.users.forEach(u => {
				if (u.user_id === user.user_id) {
					u.do_import = user.do_import;
				}
			});
		});
		this.collection.update({_id: this.users._id}, { $set: { 'users': this.users.users } });

		importSelection.channels.forEach(channel =>
			this.channels.channels.forEach(c => c.room_id === channel.channel_id && (c.do_import = channel.do_import))
		);
		this.collection.update({ _id: this.channels._id }, { $set: { 'channels': this.channels.channels }});

		const startedByUserId = Meteor.userId();
		Meteor.defer(() => {
			super.updateProgress(ProgressStep.IMPORTING_USERS);

			try {
				this.users.users.forEach(user => {
					if (!user.do_import) {
						return;
					}

					Meteor.runAsUser(startedByUserId, () => {
						const existantUser = RocketChat.models.Users.findOneByEmailAddress(user.email);
						if (existantUser) {
							user.rocketId = existantUser._id;
							this.userTags.push({
								hipchat: `@${ user.mention_name }`,
								rocket: `@${ existantUser.username }`
							});
						} else {
							const userId = Accounts.createUser({
								email: user.email,
								password: Date.now() + user.name + user.email.toUpperCase()
							});
							user.rocketId = userId;
							this.userTags.push({
								hipchat: `@${ user.mention_name }`,
								rocket: `@${ user.mention_name }`
							});
							Meteor.runAsUser(userId, () => {
								Meteor.call('setUsername', user.mention_name, {
									joinDefaultChannelsSilenced: true
								});
								Meteor.call('setAvatarFromService', user.photo_url, undefined, 'url');
								return Meteor.call('userSetUtcOffset', parseInt(moment().tz(user.timezone).format('Z').toString().split(':')[0]));
							});
							if (user.name != null) {
								RocketChat.models.Users.setName(userId, user.name);
							}
							if (user.is_deleted) {
								Meteor.call('setUserActiveStatus', userId, false);
							}
						}
						return this.addCountCompleted(1);
					});
				});

				this.collection.update({ _id: this.users._id }, { $set: { 'users': this.users.users }});

				super.updateProgress(ProgressStep.IMPORTING_CHANNELS);
				this.channels.channels.forEach(channel => {
					if (!channel.do_import) {
						return;
					}
					Meteor.runAsUser(startedByUserId, () => {
						channel.name = channel.name.replace(/ /g, '');
						const existantRoom = RocketChat.models.Rooms.findOneByName(channel.name);
						if (existantRoom) {
							channel.rocketId = existantRoom._id;
						} else {
							let userId = '';
							this.users.users.forEach(user => {
								if (user.user_id === channel.owner_user_id) {
									userId = user.rocketId;
								}
							});
							if (userId === '') {
								this.logger.warn(`Failed to find the channel creator for ${ channel.name }, setting it to the current running user.`);
								userId = startedByUserId;
							}
							Meteor.runAsUser(userId, () => {
								const returned = Meteor.call('createChannel', channel.name, []);
								return channel.rocketId = returned.rid;
							});
							RocketChat.models.Rooms.update({
								_id: channel.rocketId
							}, {
								$set: {
									'ts': new Date(channel.created * 1000)
								}
							});
						}
						return this.addCountCompleted(1);
					});
				});

				this.collection.update({ _id: this.channels._id }, { $set: { 'channels': this.channels.channels }});

				super.updateProgress(ProgressStep.IMPORTING_MESSAGES);
				const nousers = {};

				Object.keys(this.messages).forEach(channel => {
					const messagesObj = this.messages[channel];
					Meteor.runAsUser(startedByUserId, () => {
						const hipchatChannel = this.getHipChatChannelFromName(channel);
						if (hipchatChannel != null ? hipchatChannel.do_import : undefined) {
							const room = RocketChat.models.Rooms.findOneById(hipchatChannel.rocketId, {
								fields: {
									usernames: 1,
									t: 1,
									name: 1
								}
							});

							Object.keys(messagesObj).forEach(date => {
								const msgs = messagesObj[date];
								this.updateRecord({
									'messagesstatus': `${ channel }/${ date }.${ msgs.messages.length }`
								});

								msgs.messages.forEach(message => {
									if (message.from != null) {
										const user = this.getRocketUser(message.from.user_id);
										if (user != null) {
											const msgObj = {
												msg: this.convertHipChatMessageToRocketChat(message.message),
												ts: new Date(message.date),
												u: {
													_id: user._id,
													username: user.username
												}
											};
											RocketChat.sendMessage(user, msgObj, room, true);
										} else if (!nousers[message.from.user_id]) {
											nousers[message.from.user_id] = message.from;
										}
									} else if (!_.isArray(message)) {
										console.warn('Please report the following:', message);
									}
									this.addCountCompleted(1);
								});
							});
						}
					});
				});

				this.logger.warn('The following did not have users:', nousers);
				super.updateProgress(ProgressStep.FINISHING);

				this.channels.channels.forEach(channel => {
					if (channel.do_import && channel.is_archived) {
						Meteor.runAsUser(startedByUserId, () => {
							return Meteor.call('archiveRoom', channel.rocketId);
						});
					}
				});

				super.updateProgress(ProgressStep.DONE);
			} catch (e) {
				this.logger.error(e);
				super.updateProgress(ProgressStep.ERROR);
			}

			const timeTook = Date.now() - start;
			return this.logger.log(`Import took ${ timeTook } milliseconds.`);
		});

		return this.getProgress();
	}

	getHipChatChannelFromName(channelName) {
		return this.channels.channels.find(channel => channel.name === channelName);
	}

	getRocketUser(hipchatId) {
		const user = this.users.users.find(user => user.user_id === hipchatId);
		return user ? RocketChat.models.Users.findOneById(user.rocketId, {
			fields: {
				username: 1,
				name: 1
			}
		}) : undefined;
	}

	convertHipChatMessageToRocketChat(message) {
		if (message != null) {
			this.userTags.forEach(userReplace => {
				message = message.replace(userReplace.hipchat, userReplace.rocket);
			});
		} else {
			message = '';
		}
		return message;
	}

	getSelection() {
		const selectionUsers = this.users.users.map(function(user) {
			return new SelectionUser(user.user_id, user.name, user.email, user.is_deleted, false, !user.is_bot);
		});
		const selectionChannels = this.channels.channels.map(function(room) {
			return new SelectionChannel(room.room_id, room.name, room.is_archived, true, false);
		});
		return new Selection(this.name, selectionUsers, selectionChannels, this.importRecord.count.messages);
	}
}
