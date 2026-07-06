import fs from 'node:fs';
import path from 'node:path';

import type { IImportProgress, IImporterSelection } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Imports } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { Importers } from '..';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import { RocketChatImportFileInstance } from '../startup/store';

const VALID_CSV_CONTENT_TYPES = ['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel', 'text/comma-separated-values'];

const updateImportOperationStatus = async (operationId: string, status: IImportProgress['step'], valid: boolean): Promise<void> => {
	const importsModel = Imports as unknown as {
		updateOne: (selector: { _id: string }, update: { $set: { status: IImportProgress['step']; valid: boolean } }) => Promise<unknown>;
	};

	await importsModel.updateOne({ _id: operationId }, { $set: { status, valid } });
};

export const executeGetImportFileData = async (): Promise<IImporterSelection | { waiting: true }> => {
	const operation = await Imports.findLastImport();
	if (!operation) {
		throw new Meteor.Error('error-operation-not-found', 'Import Operation Not Found', 'getImportFileData');
	}

	const { importerKey } = operation;

	const importer = Importers.get(importerKey);
	if (!importer) {
		throw new Meteor.Error('error-importer-not-defined', `The importer (${importerKey}) has no import class defined.`, 'getImportFileData');
	}

	const instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

	const waitingSteps: IImportProgress['step'][] = [
		ProgressStep.DOWNLOADING_FILE,
		ProgressStep.PREPARING_CHANNELS,
		ProgressStep.PREPARING_MESSAGES,
		ProgressStep.PREPARING_USERS,
		ProgressStep.PREPARING_CONTACTS,
		ProgressStep.PREPARING_STARTED,
	];

	if (waitingSteps.indexOf(instance.progress.step) >= 0) {
		const isInvalidCSV = operation.importerKey === 'csv' && !VALID_CSV_CONTENT_TYPES.includes(operation.contentType ?? '');

		if (instance.importRecord?.valid && !isInvalidCSV) {
			return { waiting: true };
		}

		await updateImportOperationStatus(operation._id, ProgressStep.ERROR, false);
		throw new Meteor.Error('error-import-operation-invalid', 'Invalid Import Operation', 'getImportFileData');
	}

	const readySteps: IImportProgress['step'][] = [
		ProgressStep.USER_SELECTION,
		ProgressStep.DONE,
		ProgressStep.CANCELLED,
		ProgressStep.ERROR,
	];

	if (readySteps.indexOf(instance.progress.step) >= 0) {
		return instance.buildSelection();
	}

	const fileName = instance.importRecord.file;
	if (fileName) {
		const fullFilePath = fs.existsSync(fileName) ? fileName : path.join(RocketChatImportFileInstance.absolutePath, fileName);
		await instance.prepareUsingLocalFile(fullFilePath);
	}

	return instance.buildSelection();
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getImportFileData(): IImporterSelection | { waiting: true };
	}
}

Meteor.methods<ServerMethods>({
	async getImportFileData() {
		methodDeprecationLogger.method('getImportFileData', '9.0.0', '/v1/getImportFileData');
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
