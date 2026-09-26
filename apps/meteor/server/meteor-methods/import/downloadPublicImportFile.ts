import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { Import } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';

import { ProgressStep } from '../../../app/importer/lib/ImporterProgressStep';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { methodDeprecationLogger } from '../../lib/deprecationWarningLogger';
import { Importers } from '../../lib/import';
import { RocketChatImportFileInstance } from '../../lib/import/startup/store';
import { SystemLogger } from '../../lib/logger/system';
import { settings } from '../../settings';

async function getHttpFileStream(fileUrl: string): Promise<Readable> {
	const response = await fetch(fileUrl, {
		ignoreSsrfValidation: false,
		allowList: settings.get<string>('SSRF_Allowlist'),
	});

	const body = response.body as Readable;
	if (!response.ok) {
		body.resume();
		throw new Error(`Unexpected response status ${response.status}`);
	}

	return body;
}

export const executeDownloadPublicImportFile = async (userId: IUser['_id'], fileUrl: string, importerKey: string): Promise<void> => {
	const importer = Importers.get(importerKey);
	let parsedUrl: URL | undefined;
	try {
		parsedUrl = new URL(fileUrl);
	} catch (error) {
		void error;
	}
	const isUrl = parsedUrl?.protocol === 'http:' || parsedUrl?.protocol === 'https:';
	if (!importer) {
		throw new Meteor.Error(
			'error-importer-not-defined',
			`The importer (${importerKey}) has no import class defined.`,
			'downloadImportFile',
		);
	}
	if (!isUrl) {
		throw new Meteor.Error('error-invalid-import-file-url', fileUrl, 'downloadPublicImportFile');
	}

	const operation = await Import.newOperation(userId, importer.name, importer.key);
	const instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

	const oldFileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1).split('?')[0];
	const date = new Date();
	const dateStr = `${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}${date.getUTCHours()}${date.getUTCMinutes()}${date.getUTCSeconds()}`;
	const newFileName = `${dateStr}_${userId}_${oldFileName}`;

	// Store the file name on the imports collection
	await instance.startFileUpload(newFileName);
	await instance.updateProgress(ProgressStep.DOWNLOADING_FILE);

	const writeStream = RocketChatImportFileInstance.createWriteStream(newFileName);
	let errorProgressUpdate: Promise<unknown> | undefined;
	const markImportAsFailed = (): Promise<unknown> => {
		errorProgressUpdate ??= instance.updateProgress(ProgressStep.ERROR).catch((error) => {
			SystemLogger.error({ msg: 'Failed to update import progress to ERROR', err: error });
		});
		return errorProgressUpdate;
	};

	writeStream.on('error', () => {
		void markImportAsFailed();
	});

	let readStream: Readable;
	try {
		readStream = await getHttpFileStream(fileUrl);
	} catch (error) {
		writeStream.destroy();
		await markImportAsFailed();
		throw error;
	}

	writeStream.on('finish', () => {
		void instance.updateProgress(ProgressStep.FILE_LOADED);
	});

	void pipeline(readStream, writeStream).catch(() => markImportAsFailed());
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		downloadPublicImportFile(fileUrl: string, importerKey: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async downloadPublicImportFile(fileUrl: string, importerKey: string) {
		methodDeprecationLogger.method('downloadPublicImportFile', '9.0.0', '/v1/downloadPublicImportFile');
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
