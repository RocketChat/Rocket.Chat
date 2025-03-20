import fs from 'fs';

import type { IImport, IImportUser } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import { parse } from 'csv-parse/lib/sync';

import { RocketChatFile } from '../../file/server';
import { Importer, ProgressStep } from '../../importer/server';
import type { ConverterOptions } from '../../importer/server/classes/ImportDataConverter';
import type { ImporterProgress } from '../../importer/server/classes/ImporterProgress';
import type { ImporterInfo } from '../../importer/server/definitions/ImporterInfo';
import { notifyOnSettingChanged } from '../../lib/server/lib/notifyListener';

export class SlackUsersImporter extends Importer {
	private csvParser: (csv: string) => string[];

	constructor(info: ImporterInfo, importRecord: IImport, converterOptions: ConverterOptions = {}) {
		super(info, importRecord, converterOptions);

		this.csvParser = parse;
	}

	async prepareUsingLocalFile(fullFilePath: string): Promise<ImporterProgress> {
		this.logger.debug('start preparing import operation');
		await this.converter.clearImportData();

		const file = fs.readFileSync(fullFilePath);
		const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);

		const { contentType } = this.importRecord;
		const fileName = this.importRecord.file;

		const data = buffer.toString('base64');
		const dataURI = `data:${contentType};base64,${data}`;

		return this.prepare(dataURI, fileName || '');
	}

	async prepare(dataURI: string, fileName: string): Promise<ImporterProgress> {
		this.logger.debug('start preparing import operation');
		await this.converter.clearImportData();
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

			const newUser: IImportUser = {
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

		const value = await Settings.incrementValueById('Slack_Users_Importer_Count', userCount, { returnDocument: 'after' });
		if (value) {
			void notifyOnSettingChanged(value);
		}

		await super.updateRecord({ 'count.users': userCount });
		return super.getProgress();
	}
}
