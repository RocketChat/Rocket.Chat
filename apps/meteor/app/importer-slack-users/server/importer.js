import fs from 'fs';

import { Settings } from '@rocket.chat/models';

import { RocketChatFile } from '../../file/server';
import { Base, ProgressStep } from '../../importer/server';

export class SlackUsersImporter extends Base {
	constructor(info, importRecord, converterOptions = {}) {
		super(info, importRecord, converterOptions);

		const { parse } = require('csv-parse/lib/sync');

		this.csvParser = parse;
	}

	async prepareUsingLocalFile(fullFilePath) {
		this.logger.debug('start preparing import operation');
		await this.converter.clearImportData();

		const file = fs.readFileSync(fullFilePath);
		const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);

		const { contentType } = this.importRecord;
		const fileName = this.importRecord.file;

		const data = buffer.toString('base64');
		const dataURI = `data:${contentType};base64,${data}`;

		await this.updateRecord({ file: fileName });

		await super.updateProgress(ProgressStep.PREPARING_USERS);
		const uriResult = RocketChatFile.dataURIParse(dataURI);
		const buf = Buffer.from(uriResult.image, 'base64');
		const parsed = this.csvParser(buf.toString());

		let userCount = 0;
		for await (const [index, user] of parsed.entries()) {
			// Ignore the first column
			if (index === 0) {
				continue;
			}

			const username = user[0];
			const email = user[1];
			if (!email) {
				continue;
			}

			const name = user[7] || user[8] || username;

			const newUser = {
				emails: [email],
				importIds: [email],
				username,
				name,
				type: 'user',
			};

			switch (user[2]) {
				case 'Admin':
					newUser.roles = ['admin'];
					break;
				case 'Bot':
					newUser.roles = ['bot'];
					newUser.type = 'bot';
					break;
				case 'Deactivated':
					newUser.deleted = true;
					break;
			}

			await this.converter.addUser(newUser);
			userCount++;
		}

		if (userCount === 0) {
			this.logger.error('No users found in the import file.');
			await super.updateProgress(ProgressStep.ERROR);
			return super.getProgress();
		}

		await super.updateProgress(ProgressStep.USER_SELECTION);
		await super.addCountToTotal(userCount);
		await Settings.incrementValueById('Slack_Users_Importer_Count', userCount);
		await super.updateRecord({ 'count.users': userCount });
		return super.getProgress();
	}
}
