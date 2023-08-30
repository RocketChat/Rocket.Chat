import fs from 'fs';
import path from 'path';

import type { IImportFileData } from '@rocket.chat/core-typings';
import { Imports } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { Importers } from '..';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import { RocketChatImportFileInstance } from '../startup/store';

export const executeGetImportFileData = async (): Promise<IImportFileData | { waiting: true }> => {
	const operation = await Imports.findLastImport();
	if (!operation) {
		throw new Meteor.Error('error-operation-not-found', 'Import Operation Not Found', 'getImportFileData');
	}

	const { importerKey } = operation;

	const importer = Importers.get(importerKey);
	if (!importer) {
		throw new Meteor.Error('error-importer-not-defined', `The importer (${importerKey}) has no import class defined.`, 'getImportFileData');
	}

	importer.instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

	const waitingSteps = [
		ProgressStep.DOWNLOADING_FILE,
		ProgressStep.PREPARING_CHANNELS,
		ProgressStep.PREPARING_MESSAGES,
		ProgressStep.PREPARING_USERS,
		ProgressStep.PREPARING_STARTED,
	];

	if (waitingSteps.indexOf(importer.instance.progress.step) >= 0) {
		if (importer.instance.importRecord?.valid) {
			return { waiting: true };
		}
		throw new Meteor.Error('error-import-operation-invalid', 'Invalid Import Operation', 'getImportFileData');
	}

	const readySteps = [ProgressStep.USER_SELECTION, ProgressStep.DONE, ProgressStep.CANCELLED, ProgressStep.ERROR];

	if (readySteps.indexOf(importer.instance.progress.step) >= 0) {
		return importer.instance.buildSelection();
	}

	const fileName = importer.instance.importRecord.file;
	const fullFilePath = fs.existsSync(fileName) ? fileName : path.join(RocketChatImportFileInstance.absolutePath, fileName);
	await importer.instance.prepareUsingLocalFile(fullFilePath);
	return importer.instance.buildSelection();
};

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getImportFileData(): IImportFileData | { waiting: true };
	}
}

Meteor.methods<ServerMethods>({
	async getImportFileData() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', 'getImportFileData');
		}

		if (!(await hasPermissionAsync(userId, 'run-import'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', 'getImportFileData');
		}

		return executeGetImportFileData();
	},
});
