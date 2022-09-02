import { Settings } from '@rocket.chat/models';

import { Base, ProgressStep } from '../../importer/server';
import { RocketChatFile } from '../../file';

export class SlackUsersImporter extends Base {
	constructor(info, importRecord) {
		super(info, importRecord);

		const { parse } = require('csv-parse/lib/sync');

		this.csvParser = parse;
	}

	prepare(dataURI, sentContentType, fileName) {
		this.logger.debug('start preparing import operation');
		this.converter.clearImportData();
		super.prepare(dataURI, sentContentType, fileName, true);

		super.updateProgress(ProgressStep.PREPARING_USERS);
		const uriResult = RocketChatFile.dataURIParse(dataURI);
		const buf = Buffer.from(uriResult.image, 'base64');
		const parsed = this.csvParser(buf.toString());

		let userCount = 0;
		parsed.forEach((user, index) => {
			// Ignore the first column
			if (index === 0) {
				return;
			}

			const username = user[0];
			const email = user[1];
			if (!email) {
				return;
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

			this.converter.addUser(newUser);
			userCount++;
		});

		if (userCount === 0) {
			this.logger.error('No users found in the import file.');
			super.updateProgress(ProgressStep.ERROR);
			return super.getProgress();
		}

		super.updateProgress(ProgressStep.USER_SELECTION);
		super.addCountToTotal(userCount);
		Settings.incrementValueById('Slack_Users_Importer_Count', userCount);
		return super.updateRecord({ 'count.users': userCount });
	}
}
