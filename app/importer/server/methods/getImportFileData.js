import { RocketChatImportFileInstance } from '../startup/store';
import { Meteor } from 'meteor/meteor';
import { Importers } from '/app/importer';
import { hasRole } from '/app/authorization';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import path from 'path';
import fs from 'fs';

Meteor.methods({
	getImportFileData(importerKey) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getImportFileData' });
		}

		if (!hasRole(userId, 'admin')) {
			throw new Meteor.Error('not_authorized', 'User not authorized', { method: 'getImportFileData' });
		}

		const importer = Importers.get(importerKey);
		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${ importerKey }) has no import class defined.`, { method: 'getImportFileData' });
		}

		if (!importer.instance) {
			return undefined;
		}

		const waitingSteps = [
			ProgressStep.DOWNLOADING_FILE_URL,
			ProgressStep.PREPARING_CHANNELS,
			ProgressStep.PREPARING_MESSAGES,
			ProgressStep.PREPARING_USERS,
			ProgressStep.PREPARING_STARTED,
		];

		if (waitingSteps.indexOf(importer.instance.progress.step) >= 0) {
			if (importer.instance.importRecord && importer.instance.importRecord.valid) {
				return { waiting: true };
			} else {
				throw new Meteor.Error('error-import-operation-invalid', 'Invalid Import Operation', { method: 'getImportFileData' });
			}
		}

		const readySteps = [
			ProgressStep.USER_SELECTION,
			ProgressStep.DONE,
			ProgressStep.CANCELLED,
			ProgressStep.ERROR,
		];

		if (readySteps.indexOf(importer.instance.progress.step) >= 0) {
			if (importer.instance.importRecord && importer.instance.importRecord.fileData) {
				return importer.instance.importRecord.fileData;
			}
		}

		const fileName = importer.instance.importRecord.file;
		const fullFilePath = fs.existsSync(fileName) ? fileName : path.join(RocketChatImportFileInstance.absolutePath, fileName);
		const results = importer.instance.prepareUsingLocalFile(fullFilePath);

		if (results instanceof Promise) {
			return results.then((data) => {
				importer.instance.updateRecord({
					fileData: data,
				});

				return data;
			}).catch((e) => {
				console.error(e);
				throw new Meteor.Error(e);
			});

		} else {
			importer.instance.updateRecord({
				fileData: results,
			});

			return results;
		}
	},
});
