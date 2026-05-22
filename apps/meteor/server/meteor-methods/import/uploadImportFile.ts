import { Import } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { ProgressStep } from '../../../app/importer/lib/ImporterProgressStep';
import { Importers } from '../../lib/import';
import { RocketChatImportFileInstance } from '../../lib/import/startup/store';
import { RocketChatFile } from '../../lib/media/file';

export const executeUploadImportFile = async (
	userId: IUser['_id'],
	binaryContent: string,
	contentType: string,
	fileName: string,
	importerKey: string,
): Promise<void> => {
	const importer = Importers.get(importerKey);
	if (!importer) {
		throw new Meteor.Error('error-importer-not-defined', `The importer (${importerKey}) has no import class defined.`, 'uploadImportFile');
	}

	const operation = await Import.newOperation(userId, importer.name, importer.key);

	const instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

	const date = new Date();
	const dateStr = `${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}${date.getUTCHours()}${date.getUTCMinutes()}${date.getUTCSeconds()}`;
	const newFileName = `${dateStr}_${userId}_${fileName}`;

	// Store the file name and content type on the imports collection
	await instance.startFileUpload(newFileName, contentType);

	// Save the file on the File Store
	const file = Buffer.from(binaryContent, 'base64');
	const readStream = RocketChatFile.bufferToStream(file);
	const writeStream = RocketChatImportFileInstance.createWriteStream(newFileName, contentType);

	await new Promise<void>((resolve, reject) => {
		try {
			writeStream.on('end', () => {
				resolve();
			});
			writeStream.on('error', (e: Error) => {
				reject(e);
			});

			readStream.pipe(writeStream);
		} catch (error) {
			reject(error);
		}
	});

	await instance.updateProgress(ProgressStep.FILE_LOADED);
};
