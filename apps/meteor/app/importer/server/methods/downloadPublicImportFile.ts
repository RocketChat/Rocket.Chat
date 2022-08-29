import http from 'http';
import https from 'https';
import fs from 'fs';

import { Meteor } from 'meteor/meteor';
import type { IUser } from '@rocket.chat/core-typings';

import { RocketChatImportFileInstance } from '../startup/store';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import { hasPermission } from '../../../authorization/server';
import { Importers } from '..';

function downloadHttpFile(fileUrl: string, writeStream: fs.WriteStream): void {
	const protocol = fileUrl.startsWith('https') ? https : http;
	protocol.get(fileUrl, function (response) {
		response.pipe(writeStream);
	});
}

function copyLocalFile(filePath: fs.PathLike, writeStream: fs.WriteStream): void {
	const readStream = fs.createReadStream(filePath);
	readStream.pipe(writeStream);
}

export const executeDownloadPublicImportFile = (userId: IUser['_id'], fileUrl: string, importerKey: string): void => {
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

	importer.instance = new importer.importer(importer); // eslint-disable-line new-cap

	const oldFileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1).split('?')[0];
	const date = new Date();
	const dateStr = `${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}${date.getUTCHours()}${date.getUTCMinutes()}${date.getUTCSeconds()}`;
	const newFileName = `${dateStr}_${userId}_${oldFileName}`;

	// Store the file name on the imports collection
	importer.instance.startFileUpload(newFileName);
	importer.instance.updateProgress(ProgressStep.DOWNLOADING_FILE);

	const writeStream = RocketChatImportFileInstance.createWriteStream(newFileName);

	writeStream.on(
		'error',
		Meteor.bindEnvironment(() => {
			importer.instance.updateProgress(ProgressStep.ERROR);
		}),
	);

	writeStream.on(
		'end',
		Meteor.bindEnvironment(() => {
			importer.instance.updateProgress(ProgressStep.FILE_LOADED);
		}),
	);

	if (isUrl) {
		downloadHttpFile(fileUrl, writeStream);
	} else {
		// If the url is actually a folder path on the current machine, skip moving it to the file store
		if (fs.statSync(fileUrl).isDirectory()) {
			importer.instance.updateRecord({ file: fileUrl });
			importer.instance.updateProgress(ProgressStep.FILE_LOADED);
			return;
		}

		copyLocalFile(fileUrl, writeStream);
	}
};

Meteor.methods({
	downloadPublicImportFile(fileUrl: string, importerKey: string) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', 'downloadPublicImportFile');
		}

		if (!hasPermission(userId, 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', 'downloadPublicImportFile');
		}

		executeDownloadPublicImportFile(userId, fileUrl, importerKey);
	},
});
