import type { IImport } from '@rocket.chat/core-typings';
import { Settings, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { parse } from 'csv-parse/lib/sync';

import { Importer, ProgressStep, ImporterWebsocket } from '../../importer/server';
import type { ConverterOptions } from '../../importer/server/classes/ImportDataConverter';
import type { ImporterProgress } from '../../importer/server/classes/ImporterProgress';
import type { ImporterInfo } from '../../importer/server/definitions/ImporterInfo';
import { addParsedContacts } from '../../importer-omnichannel-contacts/server/addParsedContacts';
import { notifyOnSettingChanged } from '../../lib/server/lib/notifyListener';

export class CsvImporter extends Importer {
	private csvParser: (csv: string) => string[][];

	constructor(info: ImporterInfo, importRecord: IImport, converterOptions: ConverterOptions = {}) {
		super(info, importRecord, converterOptions);

		this.csvParser = parse;
	}

	async prepareUsingLocalFile(fullFilePath: string): Promise<ImporterProgress> {
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
		let contactsCount = 0;
		const dmRooms = new Set<string>();
		const roomIds = new Map<string, string>();
		const usedUsernames = new Set<string>();
		const availableUsernames = new Set<string>();

		const getRoomId = (roomName: string) => {
			const roomId = roomIds.get(roomName);

			if (roomId === undefined) {
				const fallbackRoomId = Random.id();
				roomIds.set(roomName, fallbackRoomId);
				return fallbackRoomId;
			}

			return roomId;
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

			// Parse the contacts
			if (entry.entryName.toLowerCase() === 'contacts.csv') {
				await super.updateProgress(ProgressStep.PREPARING_CONTACTS);
				const parsedContacts = this.csvParser(entry.getData().toString());

				contactsCount = await addParsedContacts.call(this.converter, parsedContacts);

				await super.updateRecord({ 'count.contacts': contactsCount });
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

				let data: { username: string; ts: string; text: string; otherUsername?: string; isDirect?: true }[];
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
						if (!msg.otherUsername) {
							continue;
						}

						const sourceId = [msg.username, msg.otherUsername].sort().join('/');

						if (!dmRooms.has(sourceId)) {
							await this.converter.addChannel({
								importIds: [sourceId],
								users: [msg.username, msg.otherUsername],
								t: 'd',
							});

							dmRooms.add(sourceId);
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
			}

			increaseProgressCount();
		}

		if (usersCount) {
			const value = await Settings.incrementValueById('CSV_Importer_Count', usersCount, { returnDocument: 'after' });
			if (value) {
				void notifyOnSettingChanged(value);
			}
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

		await super.addCountToTotal(messagesCount + usersCount + channelsCount + contactsCount);
		ImporterWebsocket.progressUpdated({ rate: 100 });

		// Ensure we have at least a single record of any kind
		if (usersCount === 0 && channelsCount === 0 && messagesCount === 0 && contactsCount === 0) {
			this.logger.error('No valid record found in the import file.');
			await super.updateProgress(ProgressStep.ERROR);
		}

		return super.getProgress();
	}
}
