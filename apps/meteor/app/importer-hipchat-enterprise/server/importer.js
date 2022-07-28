import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

import { Meteor } from 'meteor/meteor';

import { Base, ProgressStep } from '../../importer/server';
import { Settings as SettingsRaw } from '../../models/server';

export class HipChatEnterpriseImporter extends Base {
	constructor(info, importRecord) {
		super(info, importRecord);

		this.Readable = Readable;
		this.zlib = require('zlib');
		this.tarStream = require('tar-stream');
		this.extract = this.tarStream.extract();
		this.path = path;
	}

	parseData(data) {
		const dataString = data.toString();
		try {
			this.logger.debug('parsing file contents');
			return JSON.parse(dataString);
		} catch (e) {
			this.logger.error(e);
			return false;
		}
	}

	async prepareUsersFile(file) {
		super.updateProgress(ProgressStep.PREPARING_USERS);
		let count = 0;

		for (const u of file) {
			const newUser = {
				emails: [],
				importIds: [String(u.User.id)],
				username: u.User.mention_name,
				name: u.User.name,
				avatarUrl: u.User.avatar && `data:image/png;base64,${u.User.avatar.replace(/\n/g, '')}`,
				bio: u.User.title || undefined,
				deleted: u.User.is_deleted,
				type: 'user',
			};
			count++;

			if (u.User.email) {
				newUser.emails.push(u.User.email);
			}

			this.converter.addUser(newUser);
		}

		SettingsRaw.incrementValueById('Hipchat_Enterprise_Importer_Count', count);
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
				importIds: [String(r.Room.id)],
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

	async prepareUserMessagesFile(file) {
		this.logger.debug(`preparing room with ${file.length} messages `);
		let count = 0;
		const dmRooms = [];

		for (const m of file) {
			if (!m.PrivateUserMessage) {
				continue;
			}

			// If the message id is already on the list, skip it
			if (this.preparedMessages[m.PrivateUserMessage.id] !== undefined) {
				continue;
			}
			this.preparedMessages[m.PrivateUserMessage.id] = true;

			const senderId = String(m.PrivateUserMessage.sender.id);
			const receiverId = String(m.PrivateUserMessage.receiver.id);
			const users = [senderId, receiverId].sort();

			if (!dmRooms[receiverId]) {
				dmRooms[receiverId] = this.converter.findDMForImportedUsers(senderId, receiverId);

				if (!dmRooms[receiverId]) {
					const room = {
						importIds: [users.join('')],
						users,
						t: 'd',
						ts: new Date(m.PrivateUserMessage.timestamp.split(' ')[0]),
					};
					this.converter.addChannel(room);
					dmRooms[receiverId] = room;
				}
			}

			const rid = dmRooms[receiverId].importIds[0];
			const newMessage = this.convertImportedMessage(m.PrivateUserMessage, rid, 'private');
			count++;
			this.converter.addMessage(newMessage);
		}

		return count;
	}

	get turndownService() {
		const TurndownService = Promise.await(import('turndown')).default;

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
				return src ? `[${alt}](${src})` : '';
			},
		});

		this.turndownService = turndownService;

		return turndownService;
	}

	convertImportedMessage(importedMessage, rid, type) {
		const idType = type === 'private' ? type : `${rid}-${type}`;
		const newId = `hipchatenterprise-${idType}-${importedMessage.id}`;

		const newMessage = {
			_id: newId,
			rid,
			ts: new Date(importedMessage.timestamp.split(' ')[0]),
			u: {
				_id: String(importedMessage.sender.id),
			},
		};

		const text = importedMessage.message;

		if (importedMessage.message_format === 'html') {
			newMessage.msg = this.turndownService.turndown(text);
		} else if (text.startsWith('/me ')) {
			newMessage.msg = `${text.replace(/\/me /, '_')}_`;
		} else {
			newMessage.msg = text;
		}

		if (importedMessage.attachment?.url) {
			const fileId = `${importedMessage.id}-${importedMessage.attachment.name || 'attachment'}`;

			newMessage._importFile = {
				downloadUrl: importedMessage.attachment.url,
				id: `${fileId}`,
				size: importedMessage.attachment.size || 0,
				name: importedMessage.attachment.name,
				external: false,
				source: 'hipchat-enterprise',
				original: {
					...importedMessage.attachment,
				},
			};
		}

		return newMessage;
	}

	async prepareRoomMessagesFile(file, rid) {
		this.logger.debug(`preparing room with ${file.length} messages `);
		let count = 0;

		for (const m of file) {
			if (m.UserMessage) {
				const newMessage = this.convertImportedMessage(m.UserMessage, rid, 'user');
				this.converter.addMessage(newMessage);
				count++;
			} else if (m.NotificationMessage) {
				const newMessage = this.convertImportedMessage(m.NotificationMessage, rid, 'notif');
				newMessage.u._id = 'rocket.cat';
				newMessage.alias = m.NotificationMessage.sender;

				this.converter.addMessage(newMessage);
				count++;
			} else if (m.TopicRoomMessage) {
				const newMessage = this.convertImportedMessage(m.TopicRoomMessage, rid, 'topic');
				newMessage.t = 'room_changed_topic';

				this.converter.addMessage(newMessage);
				count++;
			} else if (m.ArchiveRoomMessage) {
				this.logger.warn('Archived Room Notification was ignored.');
			} else if (m.GuestAccessMessage) {
				this.logger.warn('Guess Access Notification was ignored.');
			} else {
				this.logger.error("HipChat Enterprise importer isn't configured to handle this message:", m);
			}
		}

		return count;
	}

	async prepareMessagesFile(file, info) {
		super.updateProgress(ProgressStep.PREPARING_MESSAGES);

		const [type, id] = info.dir.split('/');
		const roomIdentifier = `${type}/${id}`;

		super.updateRecord({ messagesstatus: roomIdentifier });

		switch (type) {
			case 'users':
				return this.prepareUserMessagesFile(file);
			case 'rooms':
				return this.prepareRoomMessagesFile(file, id);
			default:
				this.logger.error(`HipChat Enterprise importer isn't configured to handle "${type}" files (${info.dir}).`);
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
			case 'metadata.json':
				break;
			default:
				this.logger.error(`HipChat Enterprise importer doesn't know what to do with the file "${fileName}"`);
				break;
		}

		return 0;
	}

	prepareUsingLocalFile(fullFilePath) {
		this.logger.debug('start preparing import operation');
		this.converter.clearImportData();

		// HipChat duplicates direct messages (one for each user)
		// This object will keep track of messages that have already been prepared so it doesn't try to do it twice
		this.preparedMessages = {};
		let messageCount = 0;

		const promise = new Promise((resolve, reject) => {
			this.extract.on(
				'entry',
				Meteor.bindEnvironment((header, stream, next) => {
					this.logger.debug(`new entry from import file: ${header.name}`);
					if (!header.name.endsWith('.json')) {
						stream.resume();
						return next();
					}

					const info = this.path.parse(header.name);
					let pos = 0;
					let data = Buffer.allocUnsafe(header.size);

					stream.on(
						'data',
						Meteor.bindEnvironment((chunk) => {
							data.fill(chunk, pos, pos + chunk.length);
							pos += chunk.length;
						}),
					);

					stream.on(
						'end',
						Meteor.bindEnvironment(async () => {
							this.logger.info(`Processing the file: ${header.name}`);
							const newMessageCount = await this.prepareFile(info, data, header.name);

							messageCount += newMessageCount;
							super.updateRecord({ 'count.messages': messageCount });
							super.addCountToTotal(newMessageCount);

							data = undefined;

							this.logger.debug('next import entry');
							next();
						}),
					);

					stream.on('error', () => next());
					stream.resume();
				}),
			);

			this.extract.on('error', (err) => {
				this.logger.error('extract error:', err);
				reject(new Meteor.Error('error-import-file-extract-error'));
			});

			this.extract.on(
				'finish',
				Meteor.bindEnvironment(() => {
					resolve();
				}),
			);

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
}
