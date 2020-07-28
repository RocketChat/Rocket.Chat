import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

import { Meteor } from 'meteor/meteor';
import TurndownService from 'turndown';

import {
	Base,
	ProgressStep,
} from '../../importer/server';
import { Messages, Users } from '../../models';

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
	constructor(info, importRecord) {
		super(info, importRecord);

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

	async prepareUsersFile(file) {
		super.updateProgress(ProgressStep.PREPARING_USERS);
		let count = 0;

		for (const u of file) {
			const newUser = {
				emails: [],
				importIds: [
					String(u.User.id),
				],
				username: u.User.mention_name,
				name: u.User.name,
				// avatarUrl: u.User.avatar && u.User.avatar.replace(/\n/g, ''),
				bio: u.User.title || undefined,
				deleted: u.User.is_deleted,
				type: 'user',
			};
			count++;

			if (u.User.email) {
				newUser.emails.push(u.User.email);
			}
		}

		super.updateRecord({ 'count.users': count });
		super.addCountToTotal(count);
	}

	async prepareRoomsFile(file) {
		super.updateProgress(ProgressStep.PREPARING_CHANNELS);
		let count = 0;

		for (const r of file) {
			this.converter.addChannel({
				u: {
					_id: r.Room.owner,
				},
				importIds: [
					String(r.Room.id),
				],
				name: r.Room.name,
				users: r.Room.members,
				t: r.Room.privacy === 'private' ? 'p' : 'c',
				topic: r.Room.topic,
				ts: new Date(r.Room.created),
				archived: r.Room.is_archived,
			});

			count++;
		}

		super.updateRecord({ 'count.channels': count });
		super.addCountToTotal(count);
	}

	async prepareUserMessagesFile(file, roomIdentifier, index) {
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
				await this.storeUserTempMessages(msgs, roomIdentifier, index); // eslint-disable-line no-await-in-loop
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
				const newId = `hipchatenterprise-${ id }-user-${ m.UserMessage.id }`;
				const skipMessage = this._checkIfMessageExists(newId);
				const skipAttachment = skipMessage && (m.UserMessage.attachment_path ? this._checkIfMessageExists(`${ newId }-attachment`) : true);

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
				await this.storeTempMessages(roomMsgs, roomIdentifier, index, subIndex, id); // eslint-disable-line no-await-in-loop
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
				return this.prepareMessagesFile(file, info);
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
					await this._prepareFolderEntry(fullFilePath, fullRelativePath); // eslint-disable-line no-await-in-loop
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

				await promise.catch((error) => { // eslint-disable-line no-await-in-loop
					this.logger.error(error);
					fileData = null;
				});

				if (!fileData) {
					this.logger.info(`Skipping the file: ${ fileName }`);
					continue;
				}

				this.logger.info(`Processing the file: ${ fileName }`);
				const info = this.path.parse(fullRelativePath);
				await this.prepareFile(info, fileData, fileName); // eslint-disable-line no-await-in-loop

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

		const promise = new Promise(async (resolve, reject) => {
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

	async _finishPreparationProcess(resolve) {
		await this.fixPublicChannelMembers();

		this.logger.info('finished parsing files, checking for errors now');

		super.updateRecord({ 'count.messages': this.messagesCount, messagesstatus: null });
		super.addCountToTotal(this.messagesCount);

		resolve();
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
		}]).forEach(async (channel) => {
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

				stream.on('end', Meteor.bindEnvironment(async () => {
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

	_updateImportedUser(userToImport, existingUserId) {
		userToImport.rocketId = existingUserId;

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

	_importAttachment(msg, room, sender) {
		// if (msg.attachment_path && !msg.skipAttachment) {
		// 	const details = {
		// 		message_id: `${ msg.id }-attachment`,
		// 		name: msg.attachment.name,
		// 		size: msg.attachment.size,
		// 		userId: sender._id,
		// 		rid: room._id,
		// 	};

		// 	this.uploadFile(details, msg.attachment.url, sender, room, msg.ts);
		// }
	}

	_importSingleMessage(msg, roomIdentifier, rid) {
		if (isNaN(msg.ts)) {
			this.logger.error(`Timestamp on a message in ${ roomIdentifier } is invalid`);
			return;
		}

		// this._importAttachment(msg, rid);

		switch (msg.type) {
			case 'user':
				this.converter.addMessage({
					_id: msg.id,
					ts: msg.ts,
					msg: msg.text,
					rid,
					alias: msg.alias,
					u: {
						_id: String(msg.userId),
					},
				});
				break;
			case 'topic':
				this.converter.addMessage({
					_id: msg.id,
					ts: msg.ts,
					t: 'room_changed_topic',
					msg: msg.text,
					rid,
					u: {
						_id: msg.userId,
					},
				});
				break;
		}

		// try {
		// 	const creator = this.getRocketUserFromUserId(msg.userId);
		// 	if (creator) {
		// 		Meteor.runAsUser(creator._id, () => {
		// 			this._importAttachment(msg, room, creator);

		// 			switch (msg.type) {
		// 				case 'user':
		// 					if (!msg.skip) {
		// 						insertMessage(creator, {
		// 							_id: msg.id,
		// 							ts: msg.ts,
		// 							msg: msg.text,
		// 							rid: room._id,
		// 							alias: msg.alias,
		// 							u: {
		// 								_id: creator._id,
		// 								username: creator.username,
		// 							},
		// 						}, room, false);
		// 					}
		// 					break;
		// 				case 'topic':
		// 					Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, msg.text, creator, { _id: msg.id, ts: msg.ts });
		// 					break;
		// 			}
		// 		});
		// 	} else {
		// 		this.logger.error(`Hipchat user not found: ${ msg.userId }`);
		// 		this.addMessageError(new Meteor.Error('error-message-sender-is-invalid'), `Hipchat user not found: ${ msg.userId }`);
		// 	}
		// } catch (e) {
		// 	this.logger.error(e);
		// 	this.addMessageError(e, msg);
		// }
	}

	async _importMessageList(startedByUserId, messageListId) {
		const list = this.collection.findOneById(messageListId);
		if (!list) {
			return;
		}

		if (!list.messages) {
			return;
		}

		const { roomIdentifier, hipchatRoomId /* , name */ } = list;

		await super.updateRecord({
			messagesstatus: `${ roomIdentifier }.${ list.messages.length }`,
			'count.completed': this.progress.count.completed,
		});

		await Meteor.runAsUser(startedByUserId, async () => {
			let msgCount = 0;
			try {
				for (const msg of list.messages) {
					await this._importSingleMessage(msg, roomIdentifier, String(hipchatRoomId)); // eslint-disable-line no-await-in-loop
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
			await this._importMessageList(startedByUserId, item._id); // eslint-disable-line no-await-in-loop
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

			this.logger.debug(`${ list.messages.length } messages on this list`);
			super.updateRecord({
				messagesstatus: `${ list.name }.${ list.messages.length }`,
				'count.completed': this.progress.count.completed,
			});

			let msgCount = 0;
			const addedRooms = {};

			list.messages.forEach((msg) => {
				msgCount++;
				if (isNaN(msg.ts)) {
					this.logger.error(`Timestamp on a message in ${ list.name } is invalid`);
					return;
				}

				const rid = [msg.receiverId, msg.senderId].sort().join('');
				if (!(rid in addedRooms)) {
					this.converter.addChannel({
						importIds: [
							rid,
						],
						users: [
							String(msg.senderId),
							String(msg.receiverId),
						],
						t: 'd',
					});

					addedRooms[rid] = true;
				}

				if (importedMessages[msg.id] !== undefined) {
					return;
				}
				importedMessages[msg.id] = true;

				if (!msg.skip) {
					this.converter.addMessage({
						_id: msg.id,
						ts: msg.ts,
						msg: msg.text,
						rid,
						u: {
							_id: String(msg.senderId),
						},
					});
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
}
