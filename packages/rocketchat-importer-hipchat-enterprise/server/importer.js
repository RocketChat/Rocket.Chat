import {
	Base,
	ProgressStep,
	Selection,
	SelectionChannel,
	SelectionUser
} from 'meteor/rocketchat:importer';

export class HipChatEnterpriseImporter extends Base {
	constructor(info) {
		super(info);

		this.Readable = require('stream').Readable;
		this.zlib = require('zlib');
		this.tarStream = Npm.require('tar-stream');
		this.extract = this.tarStream.extract();
		this.path = require('path');
		this.messages = new Map();
		this.directMessages = new Map();
	}

	prepare(dataURI, sentContentType, fileName) {
		super.prepare(dataURI, sentContentType, fileName);

		const tempUsers = [];
		const tempRooms = [];
		const tempMessages = new Map();
		const tempDirectMessages = new Map();
		const promise = new Promise((resolve, reject) => {
			this.extract.on('entry', Meteor.bindEnvironment((header, stream, next) => {
				if (header.name.indexOf('.json') !== -1) {
					const info = this.path.parse(header.name);

					stream.on('data', Meteor.bindEnvironment((chunk) => {
						this.logger.debug(`Processing the file: ${ header.name }`);
						const file = JSON.parse(chunk);

						if (info.base === 'users.json') {
							super.updateProgress(ProgressStep.PREPARING_USERS);
							for (const u of file) {
								tempUsers.push({
									id: u.User.id,
									email: u.User.email,
									name: u.User.name,
									username: u.User.mention_name,
									avatar: u.User.avatar.replace(/\n/g, ''),
									timezone: u.User.timezone,
									isDeleted: u.User.is_deleted
								});
							}
						} else if (info.base === 'rooms.json') {
							super.updateProgress(ProgressStep.PREPARING_CHANNELS);
							for (const r of file) {
								tempRooms.push({
									id: r.Room.id,
									creator: r.Room.owner,
									created: new Date(r.Room.created),
									name: r.Room.name.replace(/ /g, '_').toLowerCase(),
									isPrivate: r.Room.privacy === 'private',
									isArchived: r.Room.is_archived,
									topic: r.Room.topic
								});
							}
						} else if (info.base === 'history.json') {
							const dirSplit = info.dir.split('/'); //['.', 'users', '1']
							const roomIdentifier = `${ dirSplit[1] }/${ dirSplit[2] }`;

							if (dirSplit[1] === 'users') {
								const msgs = [];
								for (const m of file) {
									if (m.PrivateUserMessage) {
										msgs.push({
											type: 'user',
											id: `hipchatenterprise-${ m.PrivateUserMessage.id }`,
											senderId: m.PrivateUserMessage.sender.id,
											receiverId: m.PrivateUserMessage.receiver.id,
											text: m.PrivateUserMessage.message.indexOf('/me ') === -1 ? m.PrivateUserMessage.message : `${ m.PrivateUserMessage.message.replace(/\/me /, '_') }_`,
											ts: new Date(m.PrivateUserMessage.timestamp.split(' ')[0])
										});
									}
								}
								tempDirectMessages.set(roomIdentifier, msgs);
							} else if (dirSplit[1] === 'rooms') {
								const roomMsgs = [];

								for (const m of file) {
									if (m.UserMessage) {
										roomMsgs.push({
											type: 'user',
											id: `hipchatenterprise-${ dirSplit[2] }-${ m.UserMessage.id }`,
											userId: m.UserMessage.sender.id,
											text: m.UserMessage.message.indexOf('/me ') === -1 ? m.UserMessage.message : `${ m.UserMessage.message.replace(/\/me /, '_') }_`,
											ts: new Date(m.UserMessage.timestamp.split(' ')[0])
										});
									} else if (m.TopicRoomMessage) {
										roomMsgs.push({
											type: 'topic',
											id: `hipchatenterprise-${ dirSplit[2] }-${ m.TopicRoomMessage.id }`,
											userId: m.TopicRoomMessage.sender.id,
											ts: new Date(m.TopicRoomMessage.timestamp.split(' ')[0]),
											text: m.TopicRoomMessage.message
										});
									} else {
										this.logger.warn('HipChat Enterprise importer isn\'t configured to handle this message:', m);
									}
								}
								tempMessages.set(roomIdentifier, roomMsgs);
							} else {
								this.logger.warn(`HipChat Enterprise importer isn't configured to handle "${ dirSplit[1] }" files.`);
							}
						} else {
							//What are these files!?
							this.logger.warn(`HipChat Enterprise importer doesn't know what to do with the file "${ header.name }" :o`, info);
						}
					}));

					stream.on('end', () => next());
					stream.on('error', () => next());
				} else {
					next();
				}
			}));

			this.extract.on('error', (err) => {
				this.logger.warn('extract error:', err);
				reject();
			});

			this.extract.on('finish', Meteor.bindEnvironment(() => {
				// Insert the users record, eventually this might have to be split into several ones as well
				// if someone tries to import a several thousands users instance
				const usersId = this.collection.insert({ 'import': this.importRecord._id, 'importer': this.name, 'type': 'users', 'users': tempUsers });
				this.users = this.collection.findOne(usersId);
				super.updateRecord({ 'count.users': tempUsers.length });
				super.addCountToTotal(tempUsers.length);

				// Insert the channels records.
				const channelsId = this.collection.insert({ 'import': this.importRecord._id, 'importer': this.name, 'type': 'channels', 'channels': tempRooms });
				this.channels = this.collection.findOne(channelsId);
				super.updateRecord({ 'count.channels': tempRooms.length });
				super.addCountToTotal(tempRooms.length);

				// Save the messages records to the import record for `startImport` usage
				super.updateProgress(ProgressStep.PREPARING_MESSAGES);
				let messagesCount = 0;
				for (const [channel, msgs] of tempMessages.entries()) {
					if (!this.messages.get(channel)) {
						this.messages.set(channel, new Map());
					}

					messagesCount += msgs.length;
					super.updateRecord({ 'messagesstatus': channel });

					if (Base.getBSONSize(msgs) > Base.getMaxBSONSize()) {
						Base.getBSONSafeArraysFromAnArray(msgs).forEach((splitMsg, i) => {
							const messagesId = this.collection.insert({ 'import': this.importRecord._id, 'importer': this.name, 'type': 'messages', 'name': `${ channel }/${ i }`, 'messages': splitMsg });
							this.messages.get(channel).set(`${ channel }.${ i }`, this.collection.findOne(messagesId));
						});
					} else {
						const messagesId = this.collection.insert({ 'import': this.importRecord._id, 'importer': this.name, 'type': 'messages', 'name': `${ channel }`, 'messages': msgs });
						this.messages.get(channel).set(channel, this.collection.findOne(messagesId));
					}
				}

				for (const [directMsgUser, msgs] of tempDirectMessages.entries()) {
					this.logger.debug(`Preparing the direct messages for: ${ directMsgUser }`);
					if (!this.directMessages.get(directMsgUser)) {
						this.directMessages.set(directMsgUser, new Map());
					}

					messagesCount += msgs.length;
					super.updateRecord({ 'messagesstatus': directMsgUser });

					if (Base.getBSONSize(msgs) > Base.getMaxBSONSize()) {
						Base.getBSONSafeArraysFromAnArray(msgs).forEach((splitMsg, i) => {
							const messagesId = this.collection.insert({ 'import': this.importRecord._id, 'importer': this.name, 'type': 'directMessages', 'name': `${ directMsgUser }/${ i }`, 'messages': splitMsg });
							this.directMessages.get(directMsgUser).set(`${ directMsgUser }.${ i }`, this.collection.findOne(messagesId));
						});
					} else {
						const messagesId = this.collection.insert({ 'import': this.importRecord._id, 'importer': this.name, 'type': 'directMessages', 'name': `${ directMsgUser }`, 'messages': msgs });
						this.directMessages.get(directMsgUser).set(directMsgUser, this.collection.findOne(messagesId));
					}
				}

				super.updateRecord({ 'count.messages': messagesCount, 'messagesstatus': null });
				super.addCountToTotal(messagesCount);

				//Ensure we have some users, channels, and messages
				if (tempUsers.length === 0 || tempRooms.length === 0 || messagesCount === 0) {
					this.logger.warn(`The loaded users count ${ tempUsers.length }, the loaded rooms ${ tempRooms.length }, and the loaded messages ${ messagesCount }`);
					super.updateProgress(ProgressStep.ERROR);
					reject();
					return;
				}

				const selectionUsers = tempUsers.map((u) => new SelectionUser(u.id, u.username, u.email, u.isDeleted, false, true));
				const selectionChannels = tempRooms.map((r) => new SelectionChannel(r.id, r.name, r.isArchived, true, r.isPrivate));
				const selectionMessages = this.importRecord.count.messages;

				super.updateProgress(ProgressStep.USER_SELECTION);

				resolve(new Selection(this.name, selectionUsers, selectionChannels, selectionMessages));
			}));

			//Wish I could make this cleaner :(
			const split = dataURI.split(',');
			const s = new this.Readable;
			s.push(new Buffer(split[split.length - 1], 'base64'));
			s.push(null);
			s.pipe(this.zlib.createGunzip()).pipe(this.extract);
		});

		return promise;
	}

	startImport(importSelection) {
		super.startImport(importSelection);
		const started = Date.now();

		//Ensure we're only going to import the users that the user has selected
		for (const user of importSelection.users) {
			for (const u of this.users.users) {
				if (u.id === user.user_id) {
					u.do_import = user.do_import;
				}
			}
		}
		this.collection.update({ _id: this.users._id }, { $set: { 'users': this.users.users }});

		//Ensure we're only importing the channels the user has selected.
		for (const channel of importSelection.channels) {
			for (const c of this.channels.channels) {
				if (c.id === channel.channel_id) {
					c.do_import = channel.do_import;
				}
			}
		}
		this.collection.update({ _id: this.channels._id }, { $set: { 'channels': this.channels.channels }});

		const startedByUserId = Meteor.userId();
		Meteor.defer(() => {
			super.updateProgress(ProgressStep.IMPORTING_USERS);

			try {
				//Import the users
				for (const u of this.users.users) {
					this.logger.debug(`Starting the user import: ${ u.username } and are we importing them? ${ u.do_import }`);
					if (!u.do_import) {
						continue;
					}

					Meteor.runAsUser(startedByUserId, () => {
						let existantUser = RocketChat.models.Users.findOneByEmailAddress(u.email);

						//If we couldn't find one by their email address, try to find an existing user by their username
						if (!existantUser) {
							existantUser = RocketChat.models.Users.findOneByUsername(u.username);
						}

						if (existantUser) {
							//since we have an existing user, let's try a few things
							u.rocketId = existantUser._id;
							RocketChat.models.Users.update({ _id: u.rocketId }, { $addToSet: { importIds: u.id } });
						} else {
							const userId = Accounts.createUser({ email: u.email, password: Date.now() + u.name + u.email.toUpperCase() });
							Meteor.runAsUser(userId, () => {
								Meteor.call('setUsername', u.username, {joinDefaultChannelsSilenced: true});
								//TODO: Use moment timezone to calc the time offset - Meteor.call 'userSetUtcOffset', user.tz_offset / 3600
								RocketChat.models.Users.setName(userId, u.name);
								//TODO: Think about using a custom field for the users "title" field

								if (u.avatar) {
									Meteor.call('setAvatarFromService', `data:image/png;base64,${ u.avatar }`);
								}

								//Deleted users are 'inactive' users in Rocket.Chat
								if (u.deleted) {
									Meteor.call('setUserActiveStatus', userId, false);
								}

								RocketChat.models.Users.update({ _id: userId }, { $addToSet: { importIds: u.id } });
								u.rocketId = userId;
							});
						}

						super.addCountCompleted(1);
					});
				}
				this.collection.update({ _id: this.users._id }, { $set: { 'users': this.users.users }});

				//Import the channels
				super.updateProgress(ProgressStep.IMPORTING_CHANNELS);
				for (const c of this.channels.channels) {
					if (!c.do_import) {
						continue;
					}

					Meteor.runAsUser(startedByUserId, () => {
						const existantRoom = RocketChat.models.Rooms.findOneByName(c.name);
						//If the room exists or the name of it is 'general', then we don't need to create it again
						if (existantRoom || c.name.toUpperCase() === 'GENERAL') {
							c.rocketId = c.name.toUpperCase() === 'GENERAL' ? 'GENERAL' : existantRoom._id;
							RocketChat.models.Rooms.update({ _id: c.rocketId }, { $addToSet: { importIds: c.id } });
						} else {
							//Find the rocketchatId of the user who created this channel
							let creatorId = startedByUserId;
							for (const u of this.users.users) {
								if (u.id === c.creator && u.do_import) {
									creatorId = u.rocketId;
								}
							}

							//Create the channel
							Meteor.runAsUser(creatorId, () => {
								const roomInfo = Meteor.call(c.isPrivate ? 'createPrivateGroup' : 'createChannel', c.name, []);
								c.rocketId = roomInfo.rid;
							});

							RocketChat.models.Rooms.update({ _id: c.rocketId }, { $set: { ts: c.created, topic: c.topic }, $addToSet: { importIds: c.id } });
						}

						super.addCountCompleted(1);
					});
				}
				this.collection.update({ _id: this.channels._id }, { $set: { 'channels': this.channels.channels }});

				//Import the Messages
				super.updateProgress(ProgressStep.IMPORTING_MESSAGES);
				for (const [ch, messagesMap] of this.messages.entries()) {
					const hipChannel = this.getChannelFromRoomIdentifier(ch);
					if (!hipChannel.do_import) {
						continue;
					}

					const room = RocketChat.models.Rooms.findOneById(hipChannel.rocketId, { fields: { usernames: 1, t: 1, name: 1 } });
					Meteor.runAsUser(startedByUserId, () => {
						for (const [msgGroupData, msgs] of messagesMap.entries()) {
							super.updateRecord({ 'messagesstatus': `${ ch }/${ msgGroupData }.${ msgs.messages.length }` });
							for (const msg of msgs.messages) {
								if (isNaN(msg.ts)) {
									this.logger.warn(`Timestamp on a message in ${ ch }/${ msgGroupData } is invalid`);
									super.addCountCompleted(1);
									continue;
								}

								const creator = this.getRocketUserFromUserId(msg.userId);
								if (creator) {
									switch (msg.type) {
										case 'user':
											RocketChat.sendMessage(creator, {
												_id: msg.id,
												ts: msg.ts,
												msg: msg.text,
												rid: room._id,
												u: {
													_id: creator._id,
													username: creator.username
												}
											}, room, true);
											break;
										case 'topic':
											RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, msg.text, creator, { _id: msg.id, ts: msg.ts });
											break;
									}
								}

								super.addCountCompleted(1);
							}
						}
					});
				}

				//Import the Direct Messages
				for (const [directMsgRoom, directMessagesMap] of this.directMessages.entries()) {
					const hipUser = this.getUserFromDirectMessageIdentifier(directMsgRoom);
					if (!hipUser.do_import) {
						continue;
					}

					//Verify this direct message user's room is valid (confusing but idk how else to explain it)
					if (!this.getRocketUserFromUserId(hipUser.id)) {
						continue;
					}

					for (const [msgGroupData, msgs] of directMessagesMap.entries()) {
						super.updateRecord({ 'messagesstatus': `${ directMsgRoom }/${ msgGroupData }.${ msgs.messages.length }` });
						for (const msg of msgs.messages) {
							if (isNaN(msg.ts)) {
								this.logger.warn(`Timestamp on a message in ${ directMsgRoom }/${ msgGroupData } is invalid`);
								super.addCountCompleted(1);
								continue;
							}

							//make sure the message sender is a valid user inside rocket.chat
							const sender = this.getRocketUserFromUserId(msg.senderId);
							if (!sender) {
								continue;
							}

							//make sure the receiver of the message is a valid rocket.chat user
							const receiver = this.getRocketUserFromUserId(msg.receiverId);
							if (!receiver) {
								continue;
							}

							let room = RocketChat.models.Rooms.findOneById([receiver._id, sender._id].sort().join(''));
							if (!room) {
								Meteor.runAsUser(sender._id, () => {
									const roomInfo = Meteor.call('createDirectMessage', receiver.username);
									room = RocketChat.models.Rooms.findOneById(roomInfo.rid);
								});
							}

							Meteor.runAsUser(sender._id, () => {
								RocketChat.sendMessage(sender, {
									_id: msg.id,
									ts: msg.ts,
									msg: msg.text,
									rid: room._id,
									u: {
										_id: sender._id,
										username: sender.username
									}
								}, room, true);
							});
						}
					}
				}

				super.updateProgress(ProgressStep.FINISHING);
				super.updateProgress(ProgressStep.DONE);
			} catch (e) {
				this.logger.error(e);
				super.updateProgress(ProgressStep.ERROR);
			}

			const timeTook = Date.now() - started;
			this.logger.log(`HipChat Enterprise Import took ${ timeTook } milliseconds.`);
		});

		return super.getProgress();
	}

	getSelection() {
		const selectionUsers = this.users.users.map((u) => new SelectionUser(u.id, u.username, u.email, false, false, true));
		const selectionChannels = this.channels.channels.map((c) => new SelectionChannel(c.id, c.name, false, true, c.isPrivate));
		const selectionMessages = this.importRecord.count.messages;

		return new Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
	}

	getChannelFromRoomIdentifier(roomIdentifier) {
		for (const ch of this.channels.channels) {
			if (`rooms/${ ch.id }` === roomIdentifier) {
				return ch;
			}
		}
	}

	getUserFromDirectMessageIdentifier(directIdentifier) {
		for (const u of this.users.users) {
			if (`users/${ u.id }` === directIdentifier) {
				return u;
			}
		}
	}

	getRocketUserFromUserId(userId) {
		for (const u of this.users.users) {
			if (u.id === userId) {
				return RocketChat.models.Users.findOneById(u.rocketId, { fields: { username: 1 }});
			}
		}
	}
}
