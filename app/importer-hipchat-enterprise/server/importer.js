import limax from 'limax';
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
} from '../../importer/server';
import { Messages, Users, Subscriptions, Rooms } from '../../models';
import { insertMessage } from '../../lib';
import { Readable } from 'stream';
import path from 'path';
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

		this.emailList = [];
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

	async storeTempUsers(tempUsers) {
		await this.collection.model.rawCollection().update({
			import: this.importRecord._id,
			importer: this.name,
			type: 'users',
		}, {
			$set: {
				import: this.importRecord._id,
				importer: this.name,
				type: 'users',
			},
			$push: {
				users: { $each: tempUsers },
			},
		}, {
			upsert: true,
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
		await this.collection.model.rawCollection().update({
			import: this.importRecord._id,
			importer: this.name,
			type: 'channels',
		}, {
			$set: {
				import: this.importRecord._id,
				importer: this.name,
				type: 'channels',
			},
			$push: {
				channels: { $each: tempRooms },
			},
		}, {
			upsert: true,
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
				name: r.Room.name,
				isPrivate: r.Room.privacy === 'private',
				isArchived: r.Room.is_archived,
				topic: r.Room.topic,
				members: r.Room.members,
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

		await this.collection.model.rawCollection().insert({
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
		this.logger.debug(`dumping ${ tempMessages.length } messages from room ${ roomIdentifier } to database`);
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
		await this.loadExistingMessagesIfNecessary();
		let msgs = [];
		this.logger.debug(`preparing room with ${ file.length } messages `);
		for (const m of file) {
			if (m.PrivateUserMessage) {
				// If the message id is already on the list, skip it
				if (this.preparedMessages[m.PrivateUserMessage.id] !== undefined) {
					continue;
				}
				this.preparedMessages[m.PrivateUserMessage.id] = true;

				const newId = `hipchatenterprise-private-${ m.PrivateUserMessage.id }`;
				const skipMessage = this._checkIfMessageExists(newId);
				const skipAttachment = skipMessage && (m.PrivateUserMessage.attachment_path ? this._checkIfMessageExists(`${ newId }-attachment`) : true);

				if (!skipMessage || !skipAttachment) {
					msgs.push({
						type: 'user',
						id: newId,
						senderId: m.PrivateUserMessage.sender.id,
						receiverId: m.PrivateUserMessage.receiver.id,
						text: m.PrivateUserMessage.message.indexOf('/me ') === -1 ? m.PrivateUserMessage.message : `${ m.PrivateUserMessage.message.replace(/\/me /, '_') }_`,
						ts: new Date(m.PrivateUserMessage.timestamp.split(' ')[0]),
						attachment: m.PrivateUserMessage.attachment,
						attachment_path: m.PrivateUserMessage.attachment_path,
						skip: skipMessage,
						skipAttachment,
					});
				}
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

	_checkIfMessageExists(messageId) {
		if (this._hasAnyImportedMessage === false) {
			return false;
		}

		return this._previewsMessagesIds.has(messageId);
	}

	async loadExistingMessagesIfNecessary() {
		if (this._hasAnyImportedMessage === false) {
			return false;
		}

		if (!this._previewsMessagesIds) {
			this._previewsMessagesIds = new Set();
			await Messages.model.rawCollection().find({}, { fields: { _id: 1 } }).forEach((i) => this._previewsMessagesIds.add(i._id));
		}
	}

	async prepareRoomMessagesFile(file, roomIdentifier, id, index) {
		let roomMsgs = [];
		this.logger.debug(`preparing room with ${ file.length } messages `);
		let subIndex = 0;

		await this.loadExistingMessagesIfNecessary();

		for (const m of file) {
			if (m.UserMessage) {
				const newId = `hipchatenterprise-${ id }-user-${ m.UserMessage.id }`;
				const skipMessage = this._checkIfMessageExists(newId);
				const skipAttachment = (skipMessage && (m.UserMessage.attachment_path ? this._checkIfMessageExists(`${ newId }-attachment`) : true));

				if (!skipMessage || !skipAttachment) {
					roomMsgs.push({
						type: 'user',
						id: newId,
						userId: m.UserMessage.sender.id,
						text: m.UserMessage.message.indexOf('/me ') === -1 ? m.UserMessage.message : `${ m.UserMessage.message.replace(/\/me /, '_') }_`,
						ts: new Date(m.UserMessage.timestamp.split(' ')[0]),
						attachment: m.UserMessage.attachment,
						attachment_path: m.UserMessage.attachment_path,
						skip: skipMessage,
						skipAttachment,
					});
				}
			} else if (m.NotificationMessage) {
				const text = m.NotificationMessage.message.indexOf('/me ') === -1 ? m.NotificationMessage.message : `${ m.NotificationMessage.message.replace(/\/me /, '_') }_`;
				const newId = `hipchatenterprise-${ id }-notif-${ m.NotificationMessage.id }`;
				const skipMessage = this._checkIfMessageExists(newId);
				const skipAttachment = skipMessage && (m.NotificationMessage.attachment_path ? this._checkIfMessageExists(`${ newId }-attachment`) : true);

				if (!skipMessage || !skipAttachment) {
					roomMsgs.push({
						type: 'user',
						id: newId,
						userId: 'rocket.cat',
						alias: m.NotificationMessage.sender,
						text: m.NotificationMessage.message_format === 'html' ? turndownService.turndown(text) : text,
						ts: new Date(m.NotificationMessage.timestamp.split(' ')[0]),
						attachment: m.NotificationMessage.attachment,
						attachment_path: m.NotificationMessage.attachment_path,
						skip: skipMessage,
						skipAttachment,
					});
				}
			} else if (m.TopicRoomMessage) {
				const newId = `hipchatenterprise-${ id }-topic-${ m.TopicRoomMessage.id }`;
				const skipMessage = this._checkIfMessageExists(newId);
				if (!skipMessage) {
					roomMsgs.push({
						type: 'topic',
						id: newId,
						userId: m.TopicRoomMessage.sender.id,
						ts: new Date(m.TopicRoomMessage.timestamp.split(' ')[0]),
						text: m.TopicRoomMessage.message,
						skip: skipMessage,
					});
				}
			} else if (m.ArchiveRoomMessage) {
				this.logger.warn('Archived Room Notification was ignored.');
			} else if (m.GuestAccessMessage) {
				this.logger.warn('Guess Access Notification was ignored.');
			} else {
				this.logger.error('HipChat Enterprise importer isn\'t configured to handle this message:', m);
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
				this.logger.error(`HipChat Enterprise importer isn't configured to handle "${ type }" files (${ info.dir }).`);
				return 0;
		}
	}

	async prepareFile(info, data, fileName) {
		const file = this.parseData(data);
		if (file === false) {
			this.logger.error('failed to parse data');
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
			case 'emoticons.json':
				this.logger.error('HipChat Enterprise importer doesn\'t import emoticons.', info);
				break;
			default:
				this.logger.error(`HipChat Enterprise importer doesn't know what to do with the file "${ fileName }" :o`, info);
				break;
		}

		return 0;
	}

	async _prepareFolderEntry(fullEntryPath, relativeEntryPath) {
		const files = fs.readdirSync(fullEntryPath);
		for (const fileName of files) {
			try {
				const fullFilePath = path.join(fullEntryPath, fileName);
				const fullRelativePath = path.join(relativeEntryPath, fileName);

				this.logger.info(`new entry from import folder: ${ fileName }`);

				if (fs.statSync(fullFilePath).isDirectory()) {
					await this._prepareFolderEntry(fullFilePath, fullRelativePath);
					continue;
				}

				if (!fileName.endsWith('.json')) {
					continue;
				}

				let fileData;

				const promise = new Promise((resolve, reject) => {
					fs.readFile(fullFilePath, (error, data) => {
						if (error) {
							this.logger.error(error);
							return reject(error);
						}

						fileData = data;
						return resolve();
					});
				});

				await promise.catch((error) => {
					this.logger.error(error);
					fileData = null;
				});

				if (!fileData) {
					this.logger.info(`Skipping the file: ${ fileName }`);
					continue;
				}

				this.logger.info(`Processing the file: ${ fileName }`);
				const info = this.path.parse(fullRelativePath);
				await this.prepareFile(info, fileData, fileName);

				this.logger.debug('moving to next import folder entry');
			} catch (e) {
				this.logger.debug('failed to prepare file');
				this.logger.error(e);
			}
		}
	}

	prepareUsingLocalFolder(fullFolderPath) {
		this.logger.debug('start preparing import operation using local folder');
		this.collection.remove({});
		this.emailList = [];

		this._hasAnyImportedMessage = Boolean(Messages.findOne({ _id: /hipchatenterprise\-.*/ }));

		this.usersCount = 0;
		this.channelsCount = 0;
		this.messagesCount = 0;

		// HipChat duplicates direct messages (one for each user)
		// This object will keep track of messages that have already been prepared so it doesn't try to do it twice
		this.preparedMessages = {};

		const promise = new Promise(async(resolve, reject) => {
			try {
				await this._prepareFolderEntry(fullFolderPath, '.');
				this._finishPreparationProcess(resolve, reject);
			} catch (e) {
				this.logger.error(e);
				reject(e);
			}
		});

		return promise;
	}

	async _finishPreparationProcess(resolve, reject) {
		await this.fixPublicChannelMembers();

		this.logger.info('finished parsing files, checking for errors now');
		this._previewsMessagesIds = undefined;
		this.emailList = [];
		this.preparedMessages = {};


		super.updateRecord({ 'count.messages': this.messagesCount, messagesstatus: null });
		super.addCountToTotal(this.messagesCount);

		// Check if any of the emails used are already taken
		if (this.emailList.length > 0) {
			const conflictingUsers = Users.find({ 'emails.address': { $in: this.emailList } });
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
		if (!this.usersCount && !this.channelsCount && !this.messagesCount) {
			this.logger.info(`users: ${ this.usersCount }, channels: ${ this.channelsCount }, messages = ${ this.messagesCount }`);
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
	}

	async fixPublicChannelMembers() {
		await this.collection.model.rawCollection().aggregate([{
			$match: {
				import: this.importRecord._id,
				type: 'channels',
			},
		}, {
			$unwind: '$channels',
		}, {
			$match: {
				'channels.members.0': { $exists: false },
			},
		}, {
			$group: { _id: '$channels.id' },
		}]).forEach(async(channel) => {
			const userIds = (await this.collection.model.rawCollection().aggregate([{
				$match: {
					$or: [
						{ roomIdentifier: `rooms/${ channel._id }` },
						{ roomIdentifier: `users/${ channel._id }` },
					],
				},
			}, {
				$unwind: '$messages',
			}, {
				$match: { 'messages.userId': { $ne: 'rocket.cat' } },
			}, {
				$group: { _id: '$messages.userId' },
			}]).toArray()).map((i) => i._id);

			await this.collection.model.rawCollection().update({
				'channels.id': channel._id,
			}, {
				$set: {
					'channels.$.members': userIds,
				},
			});
		});
	}

	prepareUsingLocalFile(fullFilePath) {
		if (fs.statSync(fullFilePath).isDirectory()) {
			return this.prepareUsingLocalFolder(fullFilePath);
		}

		this.logger.debug('start preparing import operation');
		this.collection.remove({});
		this.emailList = [];

		this._hasAnyImportedMessage = Boolean(Messages.findOne({ _id: /hipchatenterprise\-.*/ }));

		this.usersCount = 0;
		this.channelsCount = 0;
		this.messagesCount = 0;

		// HipChat duplicates direct messages (one for each user)
		// This object will keep track of messages that have already been prepared so it doesn't try to do it twice
		this.preparedMessages = {};

		const promise = new Promise((resolve, reject) => {
			this.extract.on('entry', Meteor.bindEnvironment((header, stream, next) => {
				this.logger.debug(`new entry from import file: ${ header.name }`);
				if (!header.name.endsWith('.json')) {
					stream.resume();
					return next();
				}

				const info = this.path.parse(header.name);
				let pos = 0;
				let data = Buffer.allocUnsafe(header.size);

				stream.on('data', Meteor.bindEnvironment((chunk) => {
					data.fill(chunk, pos, pos + chunk.length);
					pos += chunk.length;
				}));

				stream.on('end', Meteor.bindEnvironment(async() => {
					this.logger.info(`Processing the file: ${ header.name }`);
					await this.prepareFile(info, data, header.name);
					data = undefined;

					this.logger.debug('next import entry');
					next();
				}));

				stream.on('error', () => next());
				stream.resume();
			}));

			this.extract.on('error', (err) => {
				this.logger.error('extract error:', err);
				reject(new Meteor.Error('error-import-file-extract-error'));
			});

			this.extract.on('finish', Meteor.bindEnvironment(() => {
				this._finishPreparationProcess(resolve, reject);
			}));

			const rs = fs.createReadStream(fullFilePath);
			const gunzip = this.zlib.createGunzip();

			gunzip.on('error', (err) => {
				this.logger.error('extract error:', err);
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
			Users.update({ _id: existingUserId }, {
				$push: {
					importIds: userToImport.id,
				},
				$set: {
					active: userToImport.isDeleted !== true,
					name: userToImport.name,
					username: userToImport.username,
				},
			});

			// TODO: Think about using a custom field for the users "title" field
			if (userToImport.avatar) {
				Meteor.call('setAvatarFromService', `data:image/png;base64,${ userToImport.avatar }`);
			}
		});
	}

	_importUser(userToImport, startedByUserId) {
		Meteor.runAsUser(startedByUserId, () => {
			let existingUser = Users.findOneByUsername(userToImport.username);
			if (!existingUser) {
				// If there's no user with that username, but there's an imported user with the same original ID and no username, use that
				existingUser = Users.findOne({
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
				const user = {
					email: userToImport.email,
					password: Random.id(),
					username: userToImport.username,
					name: userToImport.name,
					active: userToImport.isDeleted !== true,
				};
				if (!user.email) {
					delete user.email;
				}
				if (!user.username) {
					delete user.username;
				}
				if (!user.name) {
					delete user.name;
				}

				try {
					const userId = Accounts.createUser(user);

					userToImport.rocketId = userId;
					this._saveUserIdReference(userToImport.id, userId);

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
		this._userDataCache = {};
		const started = Date.now();

		this._applyUserSelections(importSelection);

		const startedByUserId = Meteor.userId();
		Meteor.defer(async() => {
			try {
				await super.updateProgress(ProgressStep.IMPORTING_USERS);
				await this._importUsers(startedByUserId);

				await super.updateProgress(ProgressStep.IMPORTING_CHANNELS);
				await this._importChannels(startedByUserId);

				await super.updateProgress(ProgressStep.IMPORTING_MESSAGES);
				await this._importMessages(startedByUserId);
				await this._importDirectMessages();

				// super.updateProgress(ProgressStep.FINISHING);
				await super.updateProgress(ProgressStep.DONE);
			} catch (e) {
				super.updateRecord({ 'error-record': JSON.stringify(e, Object.getOwnPropertyNames(e)) });
				this.logger.error(e);
				super.updateProgress(ProgressStep.ERROR);
			}

			const timeTook = Date.now() - started;
			this.logger.log(`HipChat Enterprise Import took ${ timeTook } milliseconds.`);
			this._userDataCache = {};
			this._userIdReference = {};
			this._roomIdReference = {};
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

	_createSubscriptions(channelToImport, roomOrRoomId) {
		if (!channelToImport || !channelToImport.members) {
			return;
		}

		let room;
		if (roomOrRoomId && typeof roomOrRoomId === 'string') {
			room = Rooms.findOneByIdOrName(roomOrRoomId);
		} else {
			room = roomOrRoomId;
		}

		const extra = { open: true };
		channelToImport.members.forEach((hipchatUserId) => {
			if (hipchatUserId === channelToImport.creator) {
				// Creators are subscribed automatically
				return;
			}

			const user = this.getRocketUserFromUserId(hipchatUserId);
			if (!user) {
				this.logger.error(`User ${ hipchatUserId } not found on Rocket.Chat database.`);
				return;
			}

			if (Subscriptions.find({ rid: room._id, 'u._id': user._id }, { limit: 1 }).count() === 0) {
				this.logger.info(`Creating user's subscription to room ${ room._id }, rocket.chat user is ${ user._id }, hipchat user is ${ hipchatUserId }`);
				Subscriptions.createWithRoomAndUser(room, user, extra);
			}
		});
	}

	_importChannel(channelToImport, startedByUserId) {
		Meteor.runAsUser(startedByUserId, () => {
			const existingRoom = Rooms.findOneByName(limax(channelToImport.name));
			// If the room exists or the name of it is 'general', then we don't need to create it again
			if (existingRoom || channelToImport.name.toUpperCase() === 'GENERAL') {
				channelToImport.rocketId = channelToImport.name.toUpperCase() === 'GENERAL' ? 'GENERAL' : existingRoom._id;
				this._saveRoomIdReference(channelToImport.id, channelToImport.rocketId);
				Rooms.update({ _id: channelToImport.rocketId }, { $push: { importIds: channelToImport.id } });

				this._createSubscriptions(channelToImport, existingRoom || 'general');
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
					Rooms.update({ _id: channelToImport.rocketId }, { $set: { ts: channelToImport.created, topic: channelToImport.topic }, $push: { importIds: channelToImport.id } });
					this._createSubscriptions(channelToImport, channelToImport.rocketId);
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
		if (msg.attachment_path && !msg.skipAttachment) {
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
			this.logger.error(`Timestamp on a message in ${ roomIdentifier } is invalid`);
			return;
		}

		try {
			const creator = this.getRocketUserFromUserId(msg.userId);
			if (creator) {
				Meteor.runAsUser(creator._id, () => {
					this._importAttachment(msg, room, creator);

					switch (msg.type) {
						case 'user':
							if (!msg.skip) {
								insertMessage(creator, {
									_id: msg.id,
									ts: msg.ts,
									msg: msg.text,
									rid: room._id,
									alias: msg.alias,
									u: {
										_id: creator._id,
										username: creator.username,
									},
								}, room, false);
							}
							break;
						case 'topic':
							Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, msg.text, creator, { _id: msg.id, ts: msg.ts });
							break;
					}
				});
			} else {
				this.logger.error(`Hipchat user not found: ${ msg.userId }`);
				this.addMessageError(new Meteor.Error('error-message-sender-is-invalid'), `Hipchat user not found: ${ msg.userId }`);
			}
		} catch (e) {
			this.logger.error(e);
			this.addMessageError(e, msg);
		}
	}

	async _importMessageList(startedByUserId, messageListId) {
		const list = this.collection.findOneById(messageListId);
		if (!list) {
			return;
		}

		if (!list.messages) {
			return;
		}

		const { roomIdentifier, hipchatRoomId, name } = list;
		const rid = await this._getRoomRocketId(hipchatRoomId);

		// If there's no rocketId for the channel, then it wasn't imported
		if (!rid) {
			this.logger.debug(`Ignoring room ${ roomIdentifier } ( ${ name } ), as there's no rid to use.`);
			return;
		}

		const room = await Rooms.findOneById(rid, { fields: { usernames: 1, t: 1, name: 1 } });
		await super.updateRecord({
			messagesstatus: `${ roomIdentifier }.${ list.messages.length }`,
			'count.completed': this.progress.count.completed,
		});

		await Meteor.runAsUser(startedByUserId, async() => {
			let msgCount = 0;
			try {
				for (const msg of list.messages) {
					await this._importSingleMessage(msg, roomIdentifier, room);
					msgCount++;
					if (msgCount >= 50) {
						super.addCountCompleted(msgCount);
						msgCount = 0;
					}
				}
			} catch (e) {
				this.logger.error(e);
			}

			if (msgCount > 0) {
				super.addCountCompleted(msgCount);
			}
		});

	}

	async _importMessages(startedByUserId) {
		const messageListIds = this.collection.find({
			import: this.importRecord._id,
			importer: this.name,
			type: 'messages',
		}, { fields: { _id: true } }).fetch();

		for (const item of messageListIds) {
			await this._importMessageList(startedByUserId, item._id);
		}
	}

	_importDirectMessages() {
		const messageListIds = this.collection.find({
			import: this.importRecord._id,
			importer: this.name,
			type: 'user-messages',
		}, { fields: { _id: true } }).fetch();

		this.logger.info(`${ messageListIds.length } lists of messages to import.`);

		// HipChat duplicates direct messages (one for each user)
		// This object will keep track of messages that have already been imported so it doesn't try to insert them twice
		const importedMessages = {};

		messageListIds.forEach((item) => {
			this.logger.debug(`New list of user messages: ${ item._id }`);
			const list = this.collection.findOneById(item._id);
			if (!list) {
				this.logger.error('Record of user-messages list not found');
				return;
			}

			if (!list.messages) {
				this.logger.error('No message list found on record.');
				return;
			}

			const { roomIdentifier } = list;
			if (!this.getRocketUserFromRoomIdentifier(roomIdentifier)) {
				this.logger.error(`Skipping ${ list.messages.length } messages due to missing room ( ${ roomIdentifier } ).`);
				return;
			}

			this.logger.debug(`${ list.messages.length } messages on this list`);
			super.updateRecord({
				messagesstatus: `${ list.name }.${ list.messages.length }`,
				'count.completed': this.progress.count.completed,
			});

			let msgCount = 0;
			const roomUsers = {};
			const roomObjects = {};

			list.messages.forEach((msg) => {
				msgCount++;
				if (isNaN(msg.ts)) {
					this.logger.error(`Timestamp on a message in ${ list.name } is invalid`);
					return;
				}

				// make sure the message sender is a valid user inside rocket.chat
				if (!(msg.senderId in roomUsers)) {
					roomUsers[msg.senderId] = this.getRocketUserFromUserId(msg.senderId);
				}

				if (!roomUsers[msg.senderId]) {
					this.logger.error(`Skipping message due to missing sender ( ${ msg.senderId } ).`);
					return;
				}

				// make sure the receiver of the message is a valid rocket.chat user
				if (!(msg.receiverId in roomUsers)) {
					roomUsers[msg.receiverId] = this.getRocketUserFromUserId(msg.receiverId);
				}

				if (!roomUsers[msg.receiverId]) {
					this.logger.error(`Skipping message due to missing receiver ( ${ msg.receiverId } ).`);
					return;
				}

				const sender = roomUsers[msg.senderId];
				const receiver = roomUsers[msg.receiverId];

				const roomId = [receiver._id, sender._id].sort().join('');
				if (!(roomId in roomObjects)) {
					roomObjects[roomId] = Rooms.findOneById(roomId);
				}

				let room = roomObjects[roomId];
				if (!room) {
					this.logger.debug('DM room not found, creating it.');
					Meteor.runAsUser(sender._id, () => {
						const roomInfo = Meteor.call('createDirectMessage', receiver.username);

						room = Rooms.findOneById(roomInfo.rid);
						roomObjects[roomId] = room;
					});
				}

				try {
					Meteor.runAsUser(sender._id, () => {
						if (importedMessages[msg.id] !== undefined) {
							return;
						}
						importedMessages[msg.id] = true;

						if (msg.attachment_path) {
							if (!msg.skipAttachment) {
								this.logger.debug('Uploading DM file');
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

						if (!msg.skip) {
							this.logger.debug('Inserting DM message');
							insertMessage(sender, {
								_id: msg.id,
								ts: msg.ts,
								msg: msg.text,
								rid: room._id,
								u: {
									_id: sender._id,
									username: sender.username,
								},
							}, room, false);
						}
					});
				} catch (e) {
					console.error(e);
					this.addMessageError(e, msg);
				}

				if (msgCount >= 50) {
					super.addCountCompleted(msgCount);
					msgCount = 0;
				}
			});

			if (msgCount > 0) {
				super.addCountCompleted(msgCount);
			}
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

	_getBasicUserData(userId) {
		if (this._userDataCache[userId]) {
			return this._userDataCache[userId];
		}

		this._userDataCache[userId] = Users.findOneById(userId, { fields: { username: 1 } });
		return this._userDataCache[userId];
	}

	getRocketUserFromUserId(userId) {
		if (userId === 'rocket.cat') {
			return this._getBasicUserData('rocket.cat');
		}

		const rocketId = this._getUserRocketId(userId);
		if (rocketId) {
			return this._getBasicUserData(rocketId);
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
