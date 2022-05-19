import { Random } from 'meteor/random';

import { Base, ProgressStep, ImporterWebsocket } from '../../importer/server';
import { Users, Settings as SettingsRaw } from '../../models/server';

export class CsvImporter extends Base {
	constructor(info, importRecord) {
		super(info, importRecord);

		this.csvParser = require('csv-parse/lib/sync');
	}

	prepareUsingLocalFile(fullFilePath) {
		this.logger.debug('start preparing import operation');
		this.converter.clearImportData();

		const zip = new this.AdmZip(fullFilePath);
		const totalEntries = zip.getEntryCount();

		ImporterWebsocket.progressUpdated({ rate: 0 });

		let count = 0;
		let oldRate = 0;

		const increaseProgressCount = () => {
			try {
				count++;
				const rate = Math.floor((count * 1000) / totalEntries) / 10;
				if (rate > oldRate) {
					ImporterWebsocket.progressUpdated({ rate });
					oldRate = rate;
				}
			} catch (e) {
				this.logger.error(e);
			}
		};

		let messagesCount = 0;
		let usersCount = 0;
		let channelsCount = 0;
		const dmRooms = new Map();
		const roomIds = new Map();
		const usedUsernames = new Set();
		const availableUsernames = new Set();

		const getRoomId = (roomName) => {
			if (!roomIds.has(roomName)) {
				roomIds.set(roomName, Random.id());
			}

			return roomIds.get(roomName);
		};

		zip.forEach((entry) => {
			this.logger.debug(`Entry: ${entry.entryName}`);

			// Ignore anything that has `__MACOSX` in it's name, as sadly these things seem to mess everything up
			if (entry.entryName.indexOf('__MACOSX') > -1) {
				this.logger.debug(`Ignoring the file: ${entry.entryName}`);
				return increaseProgressCount();
			}

			// Directories are ignored, since they are "virtual" in a zip file
			if (entry.isDirectory) {
				this.logger.debug(`Ignoring the directory entry: ${entry.entryName}`);
				return increaseProgressCount();
			}

			// Parse the channels
			if (entry.entryName.toLowerCase() === 'channels.csv') {
				super.updateProgress(ProgressStep.PREPARING_CHANNELS);
				const parsedChannels = this.csvParser(entry.getData().toString());
				channelsCount = parsedChannels.length;

				for (const c of parsedChannels) {
					const name = c[0].trim();
					const id = getRoomId(name);
					const creator = c[1].trim();
					const isPrivate = c[2].trim().toLowerCase() === 'private';
					const members = c[3]
						.trim()
						.split(';')
						.map((m) => m.trim())
						.filter((m) => m);

					this.converter.addChannel({
						importIds: [id],
						u: {
							_id: creator,
						},
						name,
						users: members,
						t: isPrivate ? 'p' : 'c',
					});
				}

				super.updateRecord({ 'count.channels': channelsCount });
				return increaseProgressCount();
			}

			// Parse the users
			if (entry.entryName.toLowerCase() === 'users.csv') {
				super.updateProgress(ProgressStep.PREPARING_USERS);
				const parsedUsers = this.csvParser(entry.getData().toString());
				usersCount = parsedUsers.length;

				for (const u of parsedUsers) {
					const username = u[0].trim();
					availableUsernames.add(username);

					const email = u[1].trim();
					const name = u[2].trim();

					this.converter.addUser({
						importIds: [username],
						emails: [email],
						username,
						name,
					});
				}

				SettingsRaw.incrementValueById('CSV_Importer_Count', usersCount);
				super.updateRecord({ 'count.users': usersCount });
				return increaseProgressCount();
			}

			// Parse the messages
			if (entry.entryName.indexOf('/') > -1) {
				if (this.progress.step !== ProgressStep.PREPARING_MESSAGES) {
					super.updateProgress(ProgressStep.PREPARING_MESSAGES);
				}

				const item = entry.entryName.split('/'); // random/messages.csv
				const folderName = item[0]; // random

				let msgs = [];

				try {
					msgs = this.csvParser(entry.getData().toString());
				} catch (e) {
					this.logger.warn(`The file ${entry.entryName} contains invalid syntax`, e);
					return increaseProgressCount();
				}

				let data;
				const msgGroupData = item[1].split('.')[0]; // messages
				let isDirect = false;

				if (folderName.toLowerCase() === 'directmessages') {
					isDirect = true;
					data = msgs.map((m) => ({
						username: m[0],
						ts: m[2],
						text: m[3],
						otherUsername: m[1],
						isDirect: true,
					}));
				} else {
					data = msgs.map((m) => ({ username: m[0], ts: m[1], text: m[2] }));
				}

				messagesCount += data.length;
				const channelName = `${folderName}/${msgGroupData}`;

				super.updateRecord({ messagesstatus: channelName });

				if (isDirect) {
					for (const msg of data) {
						const sourceId = [msg.username, msg.otherUsername].sort().join('/');

						if (!dmRooms.has(sourceId)) {
							this.converter.addChannel({
								importIds: [sourceId],
								users: [msg.username, msg.otherUsername],
								t: 'd',
							});

							dmRooms.set(sourceId, true);
						}

						const newMessage = {
							rid: sourceId,
							u: {
								_id: msg.username,
							},
							ts: new Date(parseInt(msg.ts)),
							msg: msg.text,
						};

						usedUsernames.add(msg.username);
						usedUsernames.add(msg.otherUsername);
						this.converter.addMessage(newMessage);
					}
				} else {
					const rid = getRoomId(folderName);

					for (const msg of data) {
						const newMessage = {
							rid,
							u: {
								_id: msg.username,
							},
							ts: new Date(parseInt(msg.ts)),
							msg: msg.text,
						};

						usedUsernames.add(msg.username);
						this.converter.addMessage(newMessage);
					}
				}

				super.updateRecord({ 'count.messages': messagesCount, 'messagesstatus': null });
				return increaseProgressCount();
			}

			increaseProgressCount();
		});

		// Check if any of the message usernames was not in the imported list of users
		for (const username of usedUsernames) {
			if (availableUsernames.has(username)) {
				continue;
			}

			// Check if an user with that username already exists
			const user = Users.findOneByUsername(username);
			if (user && !user.importIds?.includes(username)) {
				// Add the username to the local user's importIds so it can be found by the import process
				// This way we can support importing new messages for existing users
				Users.addImportIds(user._id, username);
			}
		}

		super.addCountToTotal(messagesCount + usersCount + channelsCount);
		ImporterWebsocket.progressUpdated({ rate: 100 });

		// Ensure we have at least a single user, channel, or message
		if (usersCount === 0 && channelsCount === 0 && messagesCount === 0) {
			this.logger.error('No users, channels, or messages found in the import file.');
			super.updateProgress(ProgressStep.ERROR);
			return super.getProgress();
		}
	}
}
