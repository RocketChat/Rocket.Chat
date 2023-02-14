import { Meteor } from 'meteor/meteor';
import type { IUser } from '@rocket.chat/core-typings';

import { RocketChatFile } from '../../../file';
import { RocketChatImportFileInstance } from '../startup/store';
import { hasPermission } from '../../../authorization/server';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import { Importers } from '..';

export const executeUploadImportFile = (
	userId: IUser['_id'],
	binaryContent: string,
	contentType: string,
	fileName: string,
	importerKey: string,
): void => {
	const importer = Importers.get(importerKey);
	if (!importer) {
		throw new Meteor.Error('error-importer-not-defined', `The importer (${importerKey}) has no import class defined.`, 'uploadImportFile');
	}

	importer.instance = new importer.importer(importer); // eslint-disable-line new-cap

	const date = new Date();
	const dateStr = `${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}${date.getUTCHours()}${date.getUTCMinutes()}${date.getUTCSeconds()}`;
	const newFileName = `${dateStr}_${userId}_${fileName}`;

	// Store the file name and content type on the imports collection
	importer.instance.startFileUpload(newFileName, contentType);

	// Save the file on the File Store
	const file = Buffer.from(binaryContent, 'base64');
	const readStream = RocketChatFile.bufferToStream(file);
	const writeStream = RocketChatImportFileInstance.createWriteStream(newFileName, contentType);

	writeStream.on(
		'end',
		Meteor.bindEnvironment(() => {
			importer.instance.updateProgress(ProgressStep.FILE_LOADED);
		}),
	);

	readStream.pipe(writeStream);
};

Meteor.methods({
	uploadImportFile(binaryContent, contentType, fileName, importerKey) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', 'uploadImportFile');
		}

		if (!hasPermission(userId, 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', 'uploadImportFile');
		}

		executeUploadImportFile(userId, binaryContent, contentType, fileName, importerKey);
	},
});
