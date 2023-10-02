import { Settings, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

import { Base, ProgressStep, ImporterWebsocket } from '../../importer/server';

export class CsvImporter extends Base {
	constructor(info, importRecord, converterOptions = {}) {
		super(info, importRecord, converterOptions);

		const { parse } = require('csv-parse/lib/sync');

		this.csvParser = parse;
	}

	async prepareUsingLocalFile(fullFilePath) {
		this.logger.debug('start preparing import operation');
		await this.converter.clearImportData();

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

		for await (const entry of zip.getEntries()) {
			this.logger.debug(`Entry: ${entry.entryName}`);

			// Ignore anything that has `__MACOSX` in it's name, as sadly these things seem to mess everything up
			if (entry.entryName.indexOf('__MACOSX') > -1) {
				this.logger.debug(`Ignoring the file: ${entry.entryName}`);
				increaseProgressCount();
				continue;
			}

			// Directories are ignored, since they are "virtual" in a zip file
			if (entry.isDirectory) {
				this.logger.debug(`Ignoring the directory entry: ${entry.entryName}`);
				increaseProgressCount();
				continue;
			}

			// Parse the channels
			if (entry.entryName.toLowerCase() === 'channels.csv') {
				await super.updateProgress(ProgressStep.PREPARING_CHANNELS);
				const parsedChannels = this.csvParser(entry.getData().toString());
				channelsCount = parsedChannels.length;

				for await (const c of parsedChannels) {
					const name = c[0].trim();
					const id = getRoomId(name);
					const creator = c[1].trim();
					const isPrivate = c[2].trim().toLowerCase() === 'private';
					const members = c[3]
						.trim()
						.split(';')
						.map((m) => m.trim())
						.filter((m) => m);

					await this.converter.addChannel({
						importIds: [id],
						u: {
							_id: creator,
						},
						name,
						users: members,
						t: isPrivate ? 'p' : 'c',
					});
				}

				await super.updateRecord({ 'count.channels': channelsCount });
				increaseProgressCount();
				continue;
			}

			// Parse the users
			if (entry.entryName.toLowerCase() === 'users.csv') {
				await super.updateProgress(ProgressStep.PREPARING_USERS);
				const parsedUsers = this.csvParser(entry.getData().toString());
				usersCount = parsedUsers.length;

				for await (const u of parsedUsers) {
					const username = u[0].trim();
					availableUsernames.add(username);

					const email = u[1].trim();
					const name = u[2].trim();

					await this.converter.addUser({
						type: 'user',
						importIds: [username],
						emails: [email],
						username,
						name,
					});
				}

				await super.updateRecord({ 'count.users': usersCount });
				increaseProgressCount();
				continue;
			}

			// Parse the messages
			if (entry.entryName.indexOf('/') > -1) {
				if (this.progress.step !== ProgressStep.PREPARING_MESSAGES) {
					await super.updateProgress(ProgressStep.PREPARING_MESSAGES);
				}

				const item = entry.entryName.split('/'); // random/messages.csv
				const folderName = item[0]; // random

				let msgs = [];

				try {
					msgs = this.csvParser(entry.getData().toString());
				} catch (e) {
					this.logger.warn(`The file ${entry.entryName} contains invalid syntax`, e);
					increaseProgressCount();
					continue;
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

				await super.updateRecord({ messagesstatus: channelName });

				if (isDirect) {
					for await (const msg of data) {
						const sourceId = [msg.username, msg.otherUsername].sort().join('/');

						if (!dmRooms.has(sourceId)) {
							await this.converter.addChannel({
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
						await this.converter.addMessage(newMessage);
					}
				} else {
					const rid = getRoomId(folderName);

					for await (const msg of data) {
						const newMessage = {
							rid,
							u: {
								_id: msg.username,
							},
							ts: new Date(parseInt(msg.ts)),
							msg: msg.text,
						};

						usedUsernames.add(msg.username);
						await this.converter.addMessage(newMessage);
					}
				}

				await super.updateRecord({ 'count.messages': messagesCount, 'messagesstatus': null });
				increaseProgressCount();
				continue;
			}

			increaseProgressCount();
		}

		if (usersCount) {
			await Settings.incrementValueById('CSV_Importer_Count', usersCount);
		}

		// Check if any of the message usernames was not in the imported list of users
		for await (const username of usedUsernames) {
			if (availableUsernames.has(username)) {
				continue;
			}

			// Check if an user with that username already exists
			const user = await Users.findOneByUsername(username);
			if (user && !user.importIds?.includes(username)) {
				// Add the username to the local user's importIds so it can be found by the import process
				// This way we can support importing new messages for existing users
				await Users.addImportIds(user._id, username);
			}
		}

		await super.addCountToTotal(messagesCount + usersCount + channelsCount);
		ImporterWebsocket.progressUpdated({ rate: 100 });

		// Ensure we have at least a single user, channel, or message
		if (usersCount === 0 && channelsCount === 0 && messagesCount === 0) {
			this.logger.error('No users, channels, or messages found in the import file.');
			await super.updateProgress(ProgressStep.ERROR);
		}

		return super.getProgress();
	}
}
