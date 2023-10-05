import fs from 'fs';
import http from 'http';
import https from 'https';

import { Import } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { Importers } from '..';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import { RocketChatImportFileInstance } from '../startup/store';

function downloadHttpFile(fileUrl: string, writeStream: fs.WriteStream): void {
	const protocol = fileUrl.startsWith('https') ? https : http;
	protocol.get(fileUrl, (response) => {
		response.pipe(writeStream);
	});
}

function copyLocalFile(filePath: fs.PathLike, writeStream: fs.WriteStream): void {
	const readStream = fs.createReadStream(filePath);
	readStream.pipe(writeStream);
}

export const executeDownloadPublicImportFile = async (userId: IUser['_id'], fileUrl: string, importerKey: string): Promise<void> => {
	const importer = Importers.get(importerKey);
	const isUrl = fileUrl.startsWith('http');
	if (!importer) {
		throw new Meteor.Error(
			'error-importer-not-defined',
			`The importer (${importerKey}) has no import class defined.`,
			'downloadImportFile',
		);
	}
	// Check if it's a valid url or path before creating a new import record
	if (!isUrl) {
		if (!fs.existsSync(fileUrl)) {
			throw new Meteor.Error('error-import-file-missing', fileUrl, 'downloadPublicImportFile');
		}
	}

	const operation = await Import.newOperation(userId, importer.name, importer.key);
	importer.instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

	const oldFileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1).split('?')[0];
	const date = new Date();
	const dateStr = `${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}${date.getUTCHours()}${date.getUTCMinutes()}${date.getUTCSeconds()}`;
	const newFileName = `${dateStr}_${userId}_${oldFileName}`;

	// Store the file name on the imports collection
	await importer.instance.startFileUpload(newFileName);
	await importer.instance.updateProgress(ProgressStep.DOWNLOADING_FILE);

	const writeStream = RocketChatImportFileInstance.createWriteStream(newFileName);

	writeStream.on('error', () => {
		void importer.instance.updateProgress(ProgressStep.ERROR);
	});

	writeStream.on('end', () => {
		void importer.instance.updateProgress(ProgressStep.FILE_LOADED);
	});

	if (isUrl) {
		downloadHttpFile(fileUrl, writeStream);
	} else {
		// If the url is actually a folder path on the current machine, skip moving it to the file store
		if (fs.statSync(fileUrl).isDirectory()) {
			await importer.instance.updateRecord({ file: fileUrl });
			await importer.instance.updateProgress(ProgressStep.FILE_LOADED);
			return;
		}

		copyLocalFile(fileUrl, writeStream);
	}
};

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		downloadPublicImportFile(fileUrl: string, importerKey: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async downloadPublicImportFile(fileUrl: string, importerKey: string) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', 'downloadPublicImportFile');
		}

		if (!(await hasPermissionAsync(userId, 'run-import'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', 'downloadPublicImportFile');
		}

		await executeDownloadPublicImportFile(userId, fileUrl, importerKey);
	},
});
