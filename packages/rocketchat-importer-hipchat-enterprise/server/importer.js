import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import {
	Base,
	ProgressStep,
	Selection,
	SelectionChannel,
	SelectionUser,
	Imports,
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
		await this.collection.upsert({
			import: this.importRecord._id,
			importer: this.name,
			type: 'users',
		}, {
			$set: {
				import: this.importRecord._id,
				importer: this.name,
				type: 'users',
			},
			$addToSet: {
				users: { $each: tempUsers },
			},
		});

		this.usersCount += tempUsers.length;
	}

	async prepareUsersFile(file) {
		super.updateProgress(ProgressStep.PREPARING_USERS);
		let tempUsers = [];
		let count = 0;

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

		super.updateRecord({ 'count.users': count });
		super.addCountToTotal(count);
	}

	async storeTempRooms(tempRooms) {
		await this.collection.upsert({
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

		this.channelsCount += tempRooms.length;
	}

	async prepareRoomsFile(file) {
		super.updateProgress(ProgressStep.PREPARING_CHANNELS);
		let tempRooms = [];
		let count = 0;

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

		super.updateRecord({ 'count.channels': count });
		super.addCountToTotal(count);
	}

	async storeTempMessages(tempMessages, roomIdentifier, index, subIndex, hipchatRoomId) {
		this.logger.debug('dumping messages to database');
		const name = subIndex ? `${ roomIdentifier }/${ index }/${ subIndex }` : `${ roomIdentifier }/${ index }`;

		await this.collection.insert({
			import: this.importRecord._id,
			importer: this.name,
			type: 'messages',
			name,
			messages: tempMessages,
			roomIdentifier,
			hipchatRoomId,
		});

		this.messagesCount += tempMessages.length;
	}

	async storeUserTempMessages(tempMessages, roomIdentifier, index) {
		this.logger.debug('dumping messages to database');
		await this.collection.insert({
			import: this.importRecord._id,
			importer: this.name,
			type: 'user-messages',
			name: `${ roomIdentifier }/${ index }`,
			messages: tempMessages,
			roomIdentifier,
		});

		this.messagesCount += tempMessages.length;
	}

	async prepareUserMessagesFile(file, roomIdentifier, index) {
		let msgs = [];
		this.logger.debug(`preparing room with ${ file.length } messages `);
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
				await this.storeTempMessages(roomMsgs, roomIdentifier, index, subIndex, id);
				roomMsgs = [];
			}
		}

		if (roomMsgs.length > 0) {
			await this.storeTempMessages(roomMsgs, roomIdentifier, index, subIndex > 0 ? subIndex + 1 : undefined, id);
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
		this.collection.remove({});
		this.emailList = [];

		this.usersCount = 0;
		this.channelsCount = 0;
		this.messagesCount = 0;

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
					await this.prepareFile(info, data, header.name);

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

				super.updateRecord({ 'count.messages': this.messagesCount, messagesstatus: null });
				super.addCountToTotal(this.messagesCount);

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
				if (!this.usersCount || !this.channelsCount || this.messagesCount === 0) {
					this.logger.debug(`users: ${ this.usersCount }, channels: ${ this.channelsCount }, messages = ${ this.messagesCount }`);
					super.updateProgress(ProgressStep.ERROR);
					reject(new Meteor.Error('error-import-file-is-empty'));
					return;
				}

				const tempUsers = this.collection.findOne({
					import: this.importRecord._id,
					importer: this.name,
					type: 'users',
				});

				const tempChannels = this.collection.findOne({
					import: this.importRecord._id,
					importer: this.name,
					type: 'channels',
				});

				const selectionUsers = tempUsers.users.map((u) => new SelectionUser(u.id, u.username, u.email, u.isDeleted, false, u.do_import !== false, u.is_email_taken === true));
				const selectionChannels = tempChannels.channels.map((r) => new SelectionChannel(r.id, r.name, r.isArchived, true, r.isPrivate, r.creator));
				const selectionMessages = this.messagesCount;

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

	_saveUserIdReference(hipchatId, rocketId) {
		this._userIdReference[hipchatId] = rocketId;

		this.collection.update({
			import: this.importRecord._id,
			importer: this.name,
			type: 'users',
			'users.id': hipchatId,
		}, {
			$set: {
				'users.$.rocketId': rocketId,
			},
		});
	}

	_getUserRocketId(hipchatId) {
		if (!this._userIdReference) {
			return;
		}

		return this._userIdReference[hipchatId];
	}

	_saveRoomIdReference(hipchatId, rocketId) {
		this._roomIdReference[hipchatId] = rocketId;
	}

	_getRoomRocketId(hipchatId) {
		if (!this._roomIdReference) {
			return;
		}

		return this._roomIdReference[hipchatId];
	}

	_updateImportedUser(userToImport, existingUserId) {
		userToImport.rocketId = existingUserId;
		this._saveUserIdReference(userToImport.id, existingUserId);

		Meteor.runAsUser(existingUserId, () => {
			RocketChat.models.Users.update({ _id: existingUserId }, { $addToSet: { importIds: userToImport.id } });

			Meteor.call('setUsername', userToImport.username, { joinDefaultChannelsSilenced: true });

			// TODO: Use moment timezone to calc the time offset - Meteor.call 'userSetUtcOffset', user.tz_offset / 3600
			RocketChat.models.Users.setName(existingUserId, userToImport.name);
			// TODO: Think about using a custom field for the users "title" field

			if (userToImport.avatar) {
				Meteor.call('setAvatarFromService', `data:image/png;base64,${ userToImport.avatar }`);
			}

			// Deleted users are 'inactive' users in Rocket.Chat
			if (userToImport.deleted) {
				Meteor.call('setUserActiveStatus', existingUserId, false);
			}
		});
	}

	_importUser(userToImport, startedByUserId) {
		Meteor.runAsUser(startedByUserId, () => {
			let existingUser = RocketChat.models.Users.findOneByUsername(userToImport.username);
			if (!existingUser) {
				// If there's no user with that username, but there's an imported user with the same original ID and no username, use that
				existingUser = RocketChat.models.Users.findOne({
					importIds: userToImport.id,
					username: { $exists: false },
				});
			}

			if (existingUser) {
				// since we have an existing user, let's try a few things
				this._saveUserIdReference(userToImport.id, existingUser._id);
				userToImport.rocketId = existingUser._id;

				try {
					this._updateImportedUser(userToImport, existingUser._id);
				} catch (e) {
					this.logger.error(e);
					this.addUserError(userToImport.id, e);
				}
			} else {
				const user = { email: userToImport.email, password: Random.id() };
				// if (u.is_email_taken && u.email) {
				// 	user.email = user.email.replace('@', `+rocket.chat_${ Math.floor(Math.random() * 10000).toString() }@`);
				// }
				if (!user.email) {
					delete user.email;
					user.username = userToImport.username;
				}

				try {
					const userId = Accounts.createUser(user);
					this._updateImportedUser(userToImport, userId);
				} catch (e) {
					this.logger.error(e);
					this.addUserError(userToImport.id, e);
				}
			}

			super.addCountCompleted(1);
		});
	}

	_applyUserSelections(importSelection) {
		// Ensure we're only going to import the users that the user has selected
		const usersToImport = importSelection.users.filter((user) => user.do_import !== false).map((user) => user.user_id);
		const usersNotToImport = importSelection.users.filter((user) => user.do_import === false).map((user) => user.user_id);

		this.collection.update({
			import: this.importRecord._id,
			importer: this.name,
			type: 'users',
			'users.id': {
				$in: usersToImport,
			},
		}, {
			$set: {
				'users.$.do_import': true,
			},
		});

		this.collection.update({
			import: this.importRecord._id,
			importer: this.name,
			type: 'users',
			'users.id': {
				$in: usersNotToImport,
			},
		}, {
			$set: {
				'users.$.do_import': false,
			},
		});

		Imports.model.update({
			_id: this.importRecord._id,
			'fileData.users.user_id': {
				$in: usersToImport,
			},
		}, {
			$set: {
				'fileData.users.$.do_import': true,
			},
		});

		Imports.model.update({
			_id: this.importRecord._id,
			'fileData.users.user_id': {
				$in: usersNotToImport,
			},
		}, {
			$set: {
				'fileData.users.$.do_import': false,
			},
		});

		// Ensure we're only importing the channels the user has selected.
		const channelsToImport = importSelection.channels.filter((channel) => channel.do_import !== false).map((channel) => channel.channel_id);
		const channelsNotToImport = importSelection.channels.filter((channel) => channel.do_import === false).map((channel) => channel.channel_id);

		this.collection.update({
			import: this.importRecord._id,
			importer: this.name,
			type: 'channels',
			'channels.id': {
				$in: channelsToImport,
			},
		}, {
			$set: {
				'channels.$.do_import': true,
			},
		});

		this.collection.update({
			import: this.importRecord._id,
			importer: this.name,
			type: 'channels',
			'channels.id': {
				$in: channelsNotToImport,
			},
		}, {
			$set: {
				'channels.$.do_import': false,
			},
		});

		Imports.model.update({
			_id: this.importRecord._id,
			'fileData.channels.channel_id': {
				$in: channelsToImport,
			},
		}, {
			$set: {
				'fileData.channels.$.do_import': true,
			},
		});

		Imports.model.update({
			_id: this.importRecord._id,
			'fileData.channels.channel_id': {
				$in: channelsNotToImport,
			},
		}, {
			$set: {
				'fileData.channels.$.do_import': false,
			},
		});
	}

	startImport(importSelection) {
		super.startImport(importSelection);
		const started = Date.now();

		this._applyUserSelections(importSelection);

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
		this._userIdReference = {};

		const userLists = this.collection.find({
			import: this.importRecord._id,
			importer: this.name,
			type: 'users',
		});

		userLists.forEach((list) => {
			if (!list.users) {
				return;
			}

			list.users.forEach((u) => {
				this.logger.debug(`Starting the user import: ${ u.username } and are we importing them? ${ u.do_import }`);
				if (u.do_import === false) {
					return;
				}

				this._importUser(u, startedByUserId);
			});
		});
	}

	_importChannel(channelToImport, startedByUserId) {
		Meteor.runAsUser(startedByUserId, () => {
			const existingRoom = RocketChat.models.Rooms.findOneByName(channelToImport.name);
			// If the room exists or the name of it is 'general', then we don't need to create it again
			if (existingRoom || channelToImport.name.toUpperCase() === 'GENERAL') {
				channelToImport.rocketId = channelToImport.name.toUpperCase() === 'GENERAL' ? 'GENERAL' : existingRoom._id;
				this._saveRoomIdReference(channelToImport.id, channelToImport.rocketId);
				RocketChat.models.Rooms.update({ _id: channelToImport.rocketId }, { $addToSet: { importIds: channelToImport.id } });
			} else {
				// Find the rocketchatId of the user who created this channel
				const creatorId = this._getUserRocketId(channelToImport.creator) || startedByUserId;

				// Create the channel
				Meteor.runAsUser(creatorId, () => {
					try {
						const roomInfo = Meteor.call(channelToImport.isPrivate ? 'createPrivateGroup' : 'createChannel', channelToImport.name, []);
						this._saveRoomIdReference(channelToImport.id, roomInfo.rid);
						channelToImport.rocketId = roomInfo.rid;
					} catch (e) {
						this.logger.error(`Failed to create channel, using userId: ${ creatorId };`, e);
					}
				});

				if (channelToImport.rocketId) {
					RocketChat.models.Rooms.update({ _id: channelToImport.rocketId }, { $set: { ts: channelToImport.created, topic: channelToImport.topic }, $addToSet: { importIds: channelToImport.id } });
				}
			}

			super.addCountCompleted(1);
		});
	}

	_importChannels(startedByUserId) {
		this._roomIdReference = {};
		const channelLists = this.collection.find({
			import: this.importRecord._id,
			importer: this.name,
			type: 'channels',
		});

		channelLists.forEach((list) => {
			if (!list.channels) {
				return;
			}
			list.channels.forEach((c) => {
				this.logger.debug(`Starting the channel import: ${ c.name } and are we importing them? ${ c.do_import }`);
				if (c.do_import === false) {
					return;
				}

				this._importChannel(c, startedByUserId);
			});
		});
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

	_importSingleMessage(msg, roomIdentifier, room) {
		if (isNaN(msg.ts)) {
			this.logger.warn(`Timestamp on a message in ${ roomIdentifier } is invalid`);
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
		const messageListIds = this.collection.find({
			import: this.importRecord._id,
			importer: this.name,
			type: 'messages',
		}, { _id : true }).fetch();

		messageListIds.forEach((item) => {
			const list = this.collection.findOneById(item._id);
			if (!list) {
				return;
			}

			if (!list.messages) {
				return;
			}

			const { roomIdentifier, hipchatRoomId, name } = list;
			const rid = this._getRoomRocketId(hipchatRoomId);

			// If there's no rocketId for the channel, then it wasn't imported
			if (!rid) {
				this.logger.debug(`Ignoring room ${ roomIdentifier } ( ${ name } ), as there's no rid to use.`);
				return;
			}

			const room = RocketChat.models.Rooms.findOneById(rid, { fields: { usernames: 1, t: 1, name: 1 } });
			super.updateRecord({
				messagesstatus: `${ roomIdentifier }.${ list.messages.length }`,
				'count.completed': this.progress.count.completed,
			});

			Meteor.runAsUser(startedByUserId, () => {
				list.messages.forEach((msg) => {
					this._importSingleMessage(msg, roomIdentifier, room);
				});
			});
		});
	}

	_importDirectMessages() {
		const messageListIds = this.collection.find({
			import: this.importRecord._id,
			importer: this.name,
			type: 'user-messages',
		}, { _id : true }).fetch();

		messageListIds.forEach((item) => {
			const list = this.collection.findOneById(item._id);
			if (!list) {
				return;
			}

			if (!list.messages) {
				return;
			}

			const { roomIdentifier } = list;
			if (!this.getRocketUserFromRoomIdentifier(roomIdentifier)) {
				this.logger.warn(`Skipping ${ list.messages.length } messages due to missing room.`);
				return;
			}

			super.updateRecord({
				messagesstatus: `${ list.name }.${ list.messages.length }`,
				'count.completed': this.progress.count.completed,
			});

			const roomUsers = {};
			const roomObjects = {};

			list.messages.forEach((msg) => {
				if (isNaN(msg.ts)) {
					this.logger.warn(`Timestamp on a message in ${ list.name } is invalid`);
					super.addCountCompleted(1);
					return;
				}

				// make sure the message sender is a valid user inside rocket.chat
				if (!(msg.senderId in roomUsers)) {
					roomUsers[msg.senderId] = this.getRocketUserFromUserId(msg.senderId);
				}

				if (!roomUsers[msg.senderId]) {
					this.logger.warn('Skipping message due to missing sender.');
					super.addCountCompleted(1);
					return;
				}

				// make sure the receiver of the message is a valid rocket.chat user
				if (!(msg.receiverId in roomUsers)) {
					roomUsers[msg.receiverId] = this.getRocketUserFromUserId(msg.receiverId);
				}

				if (!roomUsers[msg.receiverId]) {
					this.logger.warn('Skipping message due to missing receiver.');
					super.addCountCompleted(1);
					return;
				}

				const sender = roomUsers[msg.senderId];
				const receiver = roomUsers[msg.receiverId];

				const roomId = [receiver._id, sender._id].sort().join('');
				if (!(roomId in roomObjects)) {
					roomObjects[roomId] = RocketChat.models.Rooms.findOneById(roomId);
				}

				let room = roomObjects[roomId];
				if (!room) {
					Meteor.runAsUser(sender._id, () => {
						const roomInfo = Meteor.call('createDirectMessage', receiver.username);

						room = RocketChat.models.Rooms.findOneById(roomInfo.rid);
						roomObjects[roomId] = room;
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
			});
		});
	}

	getSelection() {
		const tempUsers = this.collection.findOne({
			import: this.importRecord._id,
			importer: this.name,
			type: 'users',
		});

		const tempChannels = this.collection.findOne({
			import: this.importRecord._id,
			importer: this.name,
			type: 'channels',
		});

		const selectionUsers = tempUsers.users.map((u) => new SelectionUser(u.id, u.username, u.email, u.isDeleted, false, u.do_import !== false, u.is_email_taken === true));
		const selectionChannels = tempChannels.channels.map((r) => new SelectionChannel(r.id, r.name, r.isArchived, true, r.isPrivate, r.creator));
		const selectionMessages = this.importRecord.count.messages;

		return new Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
	}

	getRocketUserFromUserId(userId) {
		if (userId === 'rocket.cat') {
			return RocketChat.models.Users.findOneById(userId, { fields: { username: 1 } });
		}

		const rocketId = this._getUserRocketId(userId);
		if (rocketId) {
			return RocketChat.models.Users.findOneById(rocketId, { fields: { username: 1 } });
		}
	}

	getRocketUserFromRoomIdentifier(roomIdentifier) {
		const userParts = roomIdentifier.split('/');
		if (!userParts || !userParts.length) {
			return;
		}

		const userId = userParts[userParts.length - 1];
		return this.getRocketUserFromUserId(userId);
	}
}
