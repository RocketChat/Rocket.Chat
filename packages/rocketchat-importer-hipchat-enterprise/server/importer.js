import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import {
	Base,
	ProgressStep,
	Selection,
	SelectionChannel,
	SelectionUser,
} from 'meteor/rocketchat:importer';
import { RocketChat } from 'meteor/rocketchat:lib';
import { Readable } from 'stream';
import path from 'path';
import s from 'underscore.string';
import fs from 'fs';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
	strongDelimiter: '*',
	hr: '',
	br: '\n',
});

turndownService.addRule('strikethrough', {
	filter: 'img',

	replacement(content, node) {
		const src = node.getAttribute('src') || '';
		const alt = node.alt || node.title || src;
		return src ? `[${ alt }](${ src })` : '';
	},
});

export class HipChatEnterpriseImporter extends Base {
	constructor(info) {
		super(info);

		this.Readable = Readable;
		this.zlib = require('zlib');
		this.tarStream = require('tar-stream');
		this.extract = this.tarStream.extract();
		this.path = path;
		this.messages = new Map();
		this.directMessages = new Map();

		this.emailList = [];
	}

	async parseData(data) {
		const dataString = Buffer.concat(data).toString();
		let file;
		try {
			this.logger.debug('parsing file contents');
			file = JSON.parse(dataString);
			this.logger.debug('file parsed');
		} catch (e) {
			console.error(e);
			return false;
		}

		return file;
	}

	async storeTempUsers(tempUsers) {
		const result = await this.collection.upsert({
			import: this.importRecord._id,
			importer: this.name,
		}, {
			$set: {
				import: this.importRecord._id,
				importer: this.name,
			},
			$addToSet: {
				users: { $each: tempUsers },
			},
		});

		if (result.insertedId) {
			this.usersId = result.insertedId;
		}
	}

	async prepareUsersFile(file) {
		super.updateProgress(ProgressStep.PREPARING_USERS);
		let tempUsers = [];
		let count = 0;
		this.usersId = false;

		for (const u of file) {
			const userData = {
				id: u.User.id,
				email: u.User.email,
				name: u.User.name,
				username: u.User.mention_name,
				avatar: u.User.avatar && u.User.avatar.replace(/\n/g, ''),
				timezone: u.User.timezone,
				isDeleted: u.User.is_deleted,
			};
			count++;

			if (u.User.email) {
				if (this.emailList.indexOf(u.User.email) >= 0) {
					userData.is_email_taken = true;
				} else {
					this.emailList.push(u.User.email);
				}
			}

			tempUsers.push(userData);
			if (tempUsers.length >= 100) {
				await this.storeTempUsers(tempUsers);
				tempUsers = [];
			}
		}

		if (tempUsers.length > 0) {
			this.storeTempUsers(tempUsers);
		}

		// this.users = this.collection.findOne(this.usersId);
		super.updateRecord({ 'count.users': count });
		super.addCountToTotal(count);
	}

	async storeTempRooms(tempRooms) {
		const result = await this.collection.upsert({
			import: this.importRecord._id,
			importer: this.name,
			type: 'channels',
		}, {
			$set: {
				import: this.importRecord._id,
				importer: this.name,
				type: 'channels',
			},
			$addToSet: {
				channels: { $each: tempRooms },
			},
		});

		if (result.insertedId) {
			this.channelsId = result.insertedId;
		}
	}

	async prepareRoomsFile(file) {
		super.updateProgress(ProgressStep.PREPARING_CHANNELS);
		let tempRooms = [];
		let count = 0;
		this.channelsId = false;

		for (const r of file) {
			tempRooms.push({
				id: r.Room.id,
				creator: r.Room.owner,
				created: new Date(r.Room.created),
				name: s.slugify(r.Room.name),
				isPrivate: r.Room.privacy === 'private',
				isArchived: r.Room.is_archived,
				topic: r.Room.topic,
			});
			count++;

			if (tempRooms.length >= 100) {
				await this.storeTempRooms(tempRooms);
				tempRooms = [];
			}
		}

		if (tempRooms.length > 0) {
			await this.storeTempRooms(tempRooms);
		}

		// this.channels = this.collection.findOne(this.channelsId);
		super.updateRecord({ 'count.channels': count });
		super.addCountToTotal(count);
	}

	async storeTempMessages(tempMessages, roomIdentifier, index, subIndex) {
		this.logger.debug('dumping messages to database');
		const name = subIndex ? `${ roomIdentifier }/${ index }/${ subIndex }` : `${ roomIdentifier }/${ index }`;

		const messagesId = await this.collection.insert({
			import: this.importRecord._id,
			importer: this.name,
			type: 'channels',
			name,
			messages: tempMessages,
		});

		this.messagesIds.push(messagesId);
	}

	async storeUserTempMessages(tempMessages, roomIdentifier, index) {
		this.logger.debug('dumping messages to database');
		const messagesId = await this.collection.insert({
			import: this.importRecord._id,
			importer: this.name,
			type: 'messages',
			name: `${ roomIdentifier }/${ index }`,
			messages: tempMessages,
		});

		this.userMessagesIds.push(messagesId);
	}

	async prepareUserMessagesFile(file, roomIdentifier, index) {
		let msgs = [];
		for (const m of file) {
			if (m.PrivateUserMessage) {
				msgs.push({
					type: 'user',
					id: `hipchatenterprise-${ m.PrivateUserMessage.id }`,
					senderId: m.PrivateUserMessage.sender.id,
					receiverId: m.PrivateUserMessage.receiver.id,
					text: m.PrivateUserMessage.message.indexOf('/me ') === -1 ? m.PrivateUserMessage.message : `${ m.PrivateUserMessage.message.replace(/\/me /, '_') }_`,
					ts: new Date(m.PrivateUserMessage.timestamp.split(' ')[0]),
					attachment: m.PrivateUserMessage.attachment,
					attachment_path: m.PrivateUserMessage.attachment_path,
				});
			}

			if (msgs.length >= 500) {
				await this.storeUserTempMessages(msgs, roomIdentifier, index);
				msgs = [];
			}
		}

		if (msgs.length > 0) {
			await this.storeUserTempMessages(msgs, roomIdentifier, index);
		}

		return msgs.length;
	}

	async prepareRoomMessagesFile(file, roomIdentifier, id, index) {
		let roomMsgs = [];
		this.logger.debug(`preparing room with ${ file.length } messages `);
		let subIndex = 0;

		for (const m of file) {
			if (m.UserMessage) {
				roomMsgs.push({
					type: 'user',
					id: `hipchatenterprise-${ id }-${ m.UserMessage.id }`,
					userId: m.UserMessage.sender.id,
					text: m.UserMessage.message.indexOf('/me ') === -1 ? m.UserMessage.message : `${ m.UserMessage.message.replace(/\/me /, '_') }_`,
					ts: new Date(m.UserMessage.timestamp.split(' ')[0]),
					attachment: m.UserMessage.attachment,
					attachment_path: m.UserMessage.attachment_path,
				});
			} else if (m.NotificationMessage) {
				const text = m.NotificationMessage.message.indexOf('/me ') === -1 ? m.NotificationMessage.message : `${ m.NotificationMessage.message.replace(/\/me /, '_') }_`;

				roomMsgs.push({
					type: 'user',
					id: `hipchatenterprise-${ id }-${ m.NotificationMessage.id }`,
					userId: 'rocket.cat',
					alias: m.NotificationMessage.sender,
					text: m.NotificationMessage.message_format === 'html' ? turndownService.turndown(text) : text,
					ts: new Date(m.NotificationMessage.timestamp.split(' ')[0]),
					attachment: m.NotificationMessage.attachment,
					attachment_path: m.NotificationMessage.attachment_path,
				});
			} else if (m.TopicRoomMessage) {
				roomMsgs.push({
					type: 'topic',
					id: `hipchatenterprise-${ id }-${ m.TopicRoomMessage.id }`,
					userId: m.TopicRoomMessage.sender.id,
					ts: new Date(m.TopicRoomMessage.timestamp.split(' ')[0]),
					text: m.TopicRoomMessage.message,
				});
			} else {
				this.logger.warn('HipChat Enterprise importer isn\'t configured to handle this message:', m);
			}

			if (roomMsgs.length >= 500) {
				subIndex++;
				await this.storeTempMessages(roomMsgs, roomIdentifier, index, subIndex);
				roomMsgs = [];
			}
		}

		if (roomMsgs.length > 0) {
			await this.storeTempMessages(roomMsgs, roomIdentifier, index, subIndex > 0 ? subIndex + 1 : undefined);
		}

		return roomMsgs.length;
	}

	async prepareMessagesFile(file, info) {
		super.updateProgress(ProgressStep.PREPARING_MESSAGES);
		let messageGroupIndex = 0;
		let userMessageGroupIndex = 0;

		const [type, id] = info.dir.split('/'); // ['users', '1']
		const roomIdentifier = `${ type }/${ id }`;

		super.updateRecord({ messagesstatus: roomIdentifier });

		switch (type) {
			case 'users':
				userMessageGroupIndex++;
				return this.prepareUserMessagesFile(file, roomIdentifier, userMessageGroupIndex);
			case 'rooms':
				messageGroupIndex++;
				return this.prepareRoomMessagesFile(file, roomIdentifier, id, messageGroupIndex);
			default:
				this.logger.warn(`HipChat Enterprise importer isn't configured to handle "${ type }" files.`);
				return 0;
		}
	}

	async prepareFile(info, data, fileName) {
		const file = await this.parseData(data);
		if (file === false) {
			this.logger.warn('failed to parse data');
			return false;
		}

		switch (info.base) {
			case 'users.json':
				await this.prepareUsersFile(file);
				break;
			case 'rooms.json':
				await this.prepareRoomsFile(file);
				break;
			case 'history.json':
				return await this.prepareMessagesFile(file, info);
			default:
				this.logger.warn(`HipChat Enterprise importer doesn't know what to do with the file "${ fileName }" :o`, info);
				break;
		}

		return 0;
	}

	prepareUsingLocalFile(fullFilePath) {
		this.logger.debug('start preparing import operation');
		this.messagesIds = [];
		this.userMessagesIds = [];
		this.channelsId = false;
		this.usersId = false;
		this.emailList = [];
		let messageCount = 0;

		const promise = new Promise((resolve, reject) => {
			this.extract.on('entry', Meteor.bindEnvironment((header, stream, next) => {
				this.logger.debug(`new entry from import file: ${ header.name }`);
				if (!header.name.endsWith('.json')) {
					stream.resume();
					return next();
				}

				const info = this.path.parse(header.name);
				const data = [];

				stream.on('data', Meteor.bindEnvironment((chunk) => {
					data.push(chunk);
				}));

				stream.on('end', Meteor.bindEnvironment(async() => {
					this.logger.debug(`Processing the file: ${ header.name }`);
					messageCount += await this.prepareFile(info, data, header.name);

					this.logger.debug('next import entry');
					next();
				}));

				stream.on('error', () => next());
				stream.resume();
			}));

			this.extract.on('error', (err) => {
				this.logger.warn('extract error:', err);
				reject(new Meteor.Error('error-import-file-extract-error'));
			});

			this.extract.on('finish', Meteor.bindEnvironment(() => {
				this.logger.debug('finished parsing files, checking for errors now');

				super.updateRecord({ 'count.messages': messageCount, messagesstatus: null });
				super.addCountToTotal(messageCount);

				// Check if any of the emails used are already taken

				if (this.emailList.length > 0) {
					const conflictingUsers = RocketChat.models.Users.find({ 'emails.address': { $in: this.emailList } });
					const conflictingUserEmails = [];

					conflictingUsers.forEach((conflictingUser) => {
						if (conflictingUser.emails && conflictingUser.emails.length) {
							conflictingUser.emails.forEach((email) => {
								conflictingUserEmails.push(email.address);
							});
						}
					});

					if (conflictingUserEmails.length > 0) {
						this.flagConflictingEmails(conflictingUserEmails);
					}
				}

				// Ensure we have some users, channels, and messages
				if (!this.usersId || !this.channelsId || messageCount === 0) {
					super.updateProgress(ProgressStep.ERROR);
					reject(new Meteor.Error('error-import-file-is-empty'));
					return;
				}

				// const selectionUsers = tempUsers.map((u) => new SelectionUser(u.id, u.username, u.email, u.isDeleted, false, u.do_import !== false, u.is_email_taken === true));
				// const selectionChannels = tempRooms.map((r) => new SelectionChannel(r.id, r.name, r.isArchived, true, r.isPrivate, r.creator));
				// const selectionMessages = this.importRecord.count.messages;

				const selectionUsers = [];
				const selectionChannels = [];
				const selectionMessages = [];

				super.updateProgress(ProgressStep.USER_SELECTION);

				resolve(new Selection(this.name, selectionUsers, selectionChannels, selectionMessages));
			}));

			const rs = fs.createReadStream(fullFilePath);
			const gunzip = this.zlib.createGunzip();

			gunzip.on('error', (err) => {
				this.logger.warn('extract error:', err);
				reject(new Meteor.Error('error-import-file-extract-error'));
			});
			this.logger.debug('start extracting import file');
			rs.pipe(gunzip).pipe(this.extract);
		});

		return promise;
	}

	_importUser(u, startedByUserId) {
		Meteor.runAsUser(startedByUserId, () => {
			const existantUser = RocketChat.models.Users.findOneByUsername(u.username);

			if (existantUser) {
				// since we have an existing user, let's try a few things
				u.rocketId = existantUser._id;
				RocketChat.models.Users.update({ _id: u.rocketId }, { $addToSet: { importIds: u.id } });
			} else {
				const user = { email: u.email, password: Random.id() };
				// if (u.is_email_taken && u.email) {
				// 	user.email = user.email.replace('@', `+rocket.chat_${ Math.floor(Math.random() * 10000).toString() }@`);
				// }
				if (!user.email) {
					delete user.email;
					user.username = u.username;
				}

				try {
					const userId = Accounts.createUser(user);
					Meteor.runAsUser(userId, () => {
						Meteor.call('setUsername', u.username, { joinDefaultChannelsSilenced: true });
						// TODO: Use moment timezone to calc the time offset - Meteor.call 'userSetUtcOffset', user.tz_offset / 3600
						RocketChat.models.Users.setName(userId, u.name);
						// TODO: Think about using a custom field for the users "title" field

						if (u.avatar) {
							Meteor.call('setAvatarFromService', `data:image/png;base64,${ u.avatar }`);
						}

						// Deleted users are 'inactive' users in Rocket.Chat
						if (u.deleted) {
							Meteor.call('setUserActiveStatus', userId, false);
						}

						RocketChat.models.Users.update({ _id: userId }, { $addToSet: { importIds: u.id } });
						u.rocketId = userId;
					});
				} catch (e) {
					this.addUserError(u.id, e);
				}
			}

			super.addCountCompleted(1);
		});
	}

	startImport(importSelection) {
		super.startImport(importSelection);
		const started = Date.now();

		// Ensure we're only going to import the users that the user has selected
		for (const user of importSelection.users) {
			for (const u of this.users.users) {
				if (u.id === user.user_id) {
					u.do_import = user.do_import;
				}
			}
		}
		this.collection.update({ _id: this.users._id }, { $set: { users: this.users.users } });

		// Ensure we're only importing the channels the user has selected.
		for (const channel of importSelection.channels) {
			for (const c of this.channels.channels) {
				if (c.id === channel.channel_id) {
					c.do_import = channel.do_import;
				}
			}
		}
		this.collection.update({ _id: this.channels._id }, { $set: { channels: this.channels.channels } });

		const startedByUserId = Meteor.userId();
		Meteor.defer(() => {
			try {
				super.updateProgress(ProgressStep.IMPORTING_USERS);
				this._importUsers(startedByUserId);

				super.updateProgress(ProgressStep.IMPORTING_CHANNELS);
				this._importChannels(startedByUserId);

				super.updateProgress(ProgressStep.IMPORTING_MESSAGES);
				this._importMessages(startedByUserId);
				this._importDirectMessages();

				// super.updateProgress(ProgressStep.FINISHING);
				super.updateProgress(ProgressStep.DONE);
			} catch (e) {
				super.updateRecord({ 'error-record': JSON.stringify(e, Object.getOwnPropertyNames(e)) });
				this.logger.error(e);
				super.updateProgress(ProgressStep.ERROR);
			}

			const timeTook = Date.now() - started;
			this.logger.log(`HipChat Enterprise Import took ${ timeTook } milliseconds.`);
		});

		return super.getProgress();
	}

	_importUsers(startedByUserId) {
		for (const u of this.users.users) {
			this.logger.debug(`Starting the user import: ${ u.username } and are we importing them? ${ u.do_import }`);
			if (!u.do_import) {
				continue;
			}

			this._importUser(u, startedByUserId);
		}
		this.collection.update({ _id: this.users._id }, { $set: { users: this.users.users } });
	}

	_importChannels(startedByUserId) {
		for (const c of this.channels.channels) {
			if (!c.do_import) {
				continue;
			}

			Meteor.runAsUser(startedByUserId, () => {
				const existantRoom = RocketChat.models.Rooms.findOneByName(c.name);
				// If the room exists or the name of it is 'general', then we don't need to create it again
				if (existantRoom || c.name.toUpperCase() === 'GENERAL') {
					c.rocketId = c.name.toUpperCase() === 'GENERAL' ? 'GENERAL' : existantRoom._id;
					RocketChat.models.Rooms.update({ _id: c.rocketId }, { $addToSet: { importIds: c.id } });
				} else {
					// Find the rocketchatId of the user who created this channel
					let creatorId = startedByUserId;
					for (const u of this.users.users) {
						if (u.id === c.creator && u.do_import && u.rocketId) {
							creatorId = u.rocketId;
							break;
						}
					}

					// Create the channel
					Meteor.runAsUser(creatorId, () => {
						try {
							const roomInfo = Meteor.call(c.isPrivate ? 'createPrivateGroup' : 'createChannel', c.name, []);
							c.rocketId = roomInfo.rid;
						} catch (e) {
							this.logger.error(`Failed to create channel, using userId: ${ creatorId };`, e);
						}
					});

					if (c.rocketId) {
						RocketChat.models.Rooms.update({ _id: c.rocketId }, { $set: { ts: c.created, topic: c.topic }, $addToSet: { importIds: c.id } });
					}
				}

				super.addCountCompleted(1);
			});
		}
		this.collection.update({ _id: this.channels._id }, { $set: { channels: this.channels.channels } });
	}

	_importAttachment(msg, room, sender) {
		if (msg.attachment_path) {
			const details = {
				message_id: `${ msg.id }-attachment`,
				name: msg.attachment.name,
				size: msg.attachment.size,
				userId: sender._id,
				rid: room._id,
			};

			this.uploadFile(details, msg.attachment.url, sender, room, msg.ts);
		}
	}

	_importSingleMessage(msg, ch, msgGroupData, room) {
		if (isNaN(msg.ts)) {
			this.logger.warn(`Timestamp on a message in ${ ch }/${ msgGroupData } is invalid`);
			super.addCountCompleted(1);
			return;
		}

		try {
			const creator = this.getRocketUserFromUserId(msg.userId);
			if (creator) {
				this._importAttachment(msg, room, creator);

				switch (msg.type) {
					case 'user':
						RocketChat.sendMessage(creator, {
							_id: msg.id,
							ts: msg.ts,
							msg: msg.text,
							rid: room._id,
							alias: msg.alias,
							u: {
								_id: creator._id,
								username: creator.username,
							},
						}, room, true);
						break;
					case 'topic':
						RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, msg.text, creator, { _id: msg.id, ts: msg.ts });
						break;
				}
			}
		} catch (e) {
			console.error(e);
			this.addMessageError(e, msg);
		}

		super.addCountCompleted(1);
	}

	_importMessages(startedByUserId) {
		for (const [ch, messagesMap] of this.messages.entries()) {
			const hipChannel = this.getChannelFromRoomIdentifier(ch);
			if (!hipChannel.do_import) {
				continue;
			}

			const room = RocketChat.models.Rooms.findOneById(hipChannel.rocketId, { fields: { usernames: 1, t: 1, name: 1 } });
			Meteor.runAsUser(startedByUserId, () => {
				for (const [msgGroupData, msgs] of messagesMap.entries()) {
					super.updateRecord({
						messagesstatus: `${ ch }/${ msgGroupData }.${ msgs.messages.length }`,
						'count.completed': this.progress.count.completed,
					});

					for (const msg of msgs.messages) {
						this._importSingleMessage(msg, ch, msgGroupData, room);
					}
				}
			});
		}
	}

	_importDirectMessages() {
		for (const [directMsgRoom, directMessagesMap] of this.directMessages.entries()) {
			const hipUser = this.getUserFromDirectMessageIdentifier(directMsgRoom);
			if (!hipUser || !hipUser.do_import) {
				continue;
			}

			// Verify this direct message user's room is valid (confusing but idk how else to explain it)
			if (!this.getRocketUserFromUserId(hipUser.id)) {
				continue;
			}

			for (const [msgGroupData, msgs] of directMessagesMap.entries()) {
				super.updateRecord({
					messagesstatus: `${ directMsgRoom }/${ msgGroupData }.${ msgs.messages.length }`,
					'count.completed': this.progress.count.completed,
				});

				for (const msg of msgs.messages) {
					if (isNaN(msg.ts)) {
						this.logger.warn(`Timestamp on a message in ${ directMsgRoom }/${ msgGroupData } is invalid`);
						super.addCountCompleted(1);
						continue;
					}

					// make sure the message sender is a valid user inside rocket.chat
					const sender = this.getRocketUserFromUserId(msg.senderId);
					if (!sender) {
						super.addCountCompleted(1);
						continue;
					}

					// make sure the receiver of the message is a valid rocket.chat user
					const receiver = this.getRocketUserFromUserId(msg.receiverId);
					if (!receiver) {
						super.addCountCompleted(1);
						continue;
					}

					let room = RocketChat.models.Rooms.findOneById([receiver._id, sender._id].sort().join(''));
					if (!room) {
						Meteor.runAsUser(sender._id, () => {
							const roomInfo = Meteor.call('createDirectMessage', receiver.username);
							room = RocketChat.models.Rooms.findOneById(roomInfo.rid);
						});
					}

					try {
						Meteor.runAsUser(sender._id, () => {
							if (msg.attachment_path) {
								const details = {
									message_id: `${ msg.id }-attachment`,
									name: msg.attachment.name,
									size: msg.attachment.size,
									userId: sender._id,
									rid: room._id,
								};
								this.uploadFile(details, msg.attachment.url, sender, room, msg.ts);
							} else {
								RocketChat.sendMessage(sender, {
									_id: msg.id,
									ts: msg.ts,
									msg: msg.text,
									rid: room._id,
									u: {
										_id: sender._id,
										username: sender.username,
									},
								}, room, true);
							}
						});
					} catch (e) {
						console.error(e);
						this.addMessageError(e, msg);
					}

					super.addCountCompleted(1);
				}
			}
		}
	}

	getSelection() {
		const selectionUsers = this.users.users.map((u) => new SelectionUser(u.id, u.username, u.email, u.isDeleted === true, false, u.do_import !== false, u.is_email_taken === true));
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
		if (userId === 'rocket.cat') {
			return RocketChat.models.Users.findOneById(userId, { fields: { username: 1 } });
		}

		for (const u of this.users.users) {
			if (u.id === userId) {
				return RocketChat.models.Users.findOneById(u.rocketId, { fields: { username: 1 } });
			}
		}
	}
}
