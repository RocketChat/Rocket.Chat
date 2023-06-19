import { Meteor } from 'meteor/meteor';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { RocketChatFile } from '../../../file/server';
import { RocketChatImportFileInstance } from '../startup/store';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import { Importers } from '..';

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

	importer.instance = new importer.importer(importer); // eslint-disable-line new-cap
	await importer.instance.build();

	const date = new Date();
	const dateStr = `${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}${date.getUTCHours()}${date.getUTCMinutes()}${date.getUTCSeconds()}`;
	const newFileName = `${dateStr}_${userId}_${fileName}`;

	// Store the file name and content type on the imports collection
	await importer.instance.startFileUpload(newFileName, contentType);

	// Save the file on the File Store
	const file = Buffer.from(binaryContent, 'base64');
	const readStream = RocketChatFile.bufferToStream(file);
	const writeStream = RocketChatImportFileInstance.createWriteStream(newFileName, contentType);

	writeStream.on('end', () => {
		importer.instance.updateProgress(ProgressStep.FILE_LOADED);
	});

	readStream.pipe(writeStream);
};

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		uploadImportFile(binaryContent: string, contentType: string, fileName: string, importerKey: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async uploadImportFile(binaryContent, contentType, fileName, importerKey) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', 'uploadImportFile');
		}

		if (!(await hasPermissionAsync(userId, 'run-import'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', 'uploadImportFile');
		}

		await executeUploadImportFile(userId, binaryContent, contentType, fileName, importerKey);
	},
});
