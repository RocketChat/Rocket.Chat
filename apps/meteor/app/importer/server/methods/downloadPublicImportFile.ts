import { Import } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';

import { Importers } from '..';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import { RocketChatImportFileInstance } from '../startup/store';

const getPublicImportUrl = (fileUrl: string): URL => {
	try {
		const url = new URL(fileUrl);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			throw new Error('Invalid protocol');
		}

		return url;
	} catch {
		throw new Meteor.Error('error-invalid-url', 'Import files must be downloaded from a valid HTTP or HTTPS URL.', 'downloadPublicImportFile');
	}
};

async function downloadHttpFile(fileUrl: string, writeStream: ReturnType<typeof RocketChatImportFileInstance.createWriteStream>): Promise<void> {
	const response = await fetch(fileUrl, {
		ignoreSsrfValidation: false,
		allowList: settings.get<string>('SSRF_Allowlist'),
	});

	if (response.status !== 200) {
		throw new Meteor.Error('error-import-file-download-failed', 'Failed to download import file.', 'downloadPublicImportFile');
	}

	const fileBuffer = Buffer.from(await response.arrayBuffer());
	await new Promise<void>((resolve, reject) => {
		writeStream.once('error', reject);
		writeStream.end(fileBuffer, resolve);
	});
}

export const executeDownloadPublicImportFile = async (userId: IUser['_id'], fileUrl: string, importerKey: string): Promise<void> => {
	const importer = Importers.get(importerKey);
	const publicImportUrl = getPublicImportUrl(fileUrl);
	if (!importer) {
		throw new Meteor.Error(
			'error-importer-not-defined',
			`The importer (${importerKey}) has no import class defined.`,
			'downloadImportFile',
		);
	}

	const operation = await Import.newOperation(userId, importer.name, importer.key);
	const instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

	const oldFileName = publicImportUrl.pathname.substring(publicImportUrl.pathname.lastIndexOf('/') + 1) || 'import-file';
	const date = new Date();
	const dateStr = `${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}${date.getUTCHours()}${date.getUTCMinutes()}${date.getUTCSeconds()}`;
	const newFileName = `${dateStr}_${userId}_${oldFileName}`;

	// Store the file name on the imports collection
	await instance.startFileUpload(newFileName);
	await instance.updateProgress(ProgressStep.DOWNLOADING_FILE);

	const writeStream = RocketChatImportFileInstance.createWriteStream(newFileName);

	writeStream.on('error', () => {
		void instance.updateProgress(ProgressStep.ERROR);
	});

	writeStream.on('finish', () => {
		void instance.updateProgress(ProgressStep.FILE_LOADED);
	});

	try {
		await downloadHttpFile(publicImportUrl.toString(), writeStream);
	} catch (error) {
		writeStream.destroy();
		await instance.updateProgress(ProgressStep.ERROR);
		throw error;
	}
};

declare module '@rocket.chat/ddp-client' {
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
