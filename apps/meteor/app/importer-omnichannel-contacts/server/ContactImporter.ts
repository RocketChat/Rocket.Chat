import fs from 'node:fs';

import type { IImport } from '@rocket.chat/core-typings';
import { parse } from 'csv-parse/lib/sync';

import { addParsedContacts } from './addParsedContacts';
import { Importer, ProgressStep, ImporterWebsocket } from '../../importer/server';
import type { ConverterOptions } from '../../importer/server/classes/ImportDataConverter';
import type { ImporterProgress } from '../../importer/server/classes/ImporterProgress';
import type { ImporterInfo } from '../../importer/server/definitions/ImporterInfo';

export class ContactImporter extends Importer {
	private csvParser: (csv: string) => string[][];

	constructor(info: ImporterInfo, importRecord: IImport, converterOptions: ConverterOptions = {}) {
		super(info, importRecord, converterOptions);

		this.csvParser = parse;
	}

	async prepareUsingLocalFile(fullFilePath: string): Promise<ImporterProgress> {
		this.logger.debug('start preparing import operation');
		await this.converter.clearImportData();

		ImporterWebsocket.progressUpdated({ rate: 0 });

		await super.updateProgress(ProgressStep.PREPARING_CONTACTS);
		// Reading the whole file at once for compatibility with the code written for the other importers
		// We can change this to a stream once we improve the rest of the importer classes
		const fileContents = fs.readFileSync(fullFilePath, { encoding: 'utf8' });
		if (!fileContents || typeof fileContents !== 'string') {
			throw new Error('Failed to load file contents.');
		}

		const parsedContacts = this.csvParser(fileContents);
		const contactsCount = await addParsedContacts.call(this.converter, parsedContacts);

		if (contactsCount === 0) {
			this.logger.error('No contacts found in the import file.');
			await super.updateProgress(ProgressStep.ERROR);
		} else {
			await super.updateRecord({ 'count.contacts': contactsCount, 'count.total': contactsCount });
			ImporterWebsocket.progressUpdated({ rate: 100 });
		}

		return super.getProgress();
	}
}
