import { RocketChatImportFileInstance } from '../startup/store';
import { Meteor } from 'meteor/meteor';
import { Importers } from 'meteor/rocketchat:importer';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import path from 'path';

Meteor.methods({
	getImportFileData(importerKey) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getImportFileData' });
		}

		if (!RocketChat.authz.hasRole(userId, 'admin')) {
			throw new Meteor.Error('not_authorized', 'User not authorized', { method: 'getImportFileData' });
		}

		const importer = Importers.get(importerKey);
		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${ importerKey }) has no import class defined.`, { method: 'getImportFileData' });
		}

		if (!importer.instance) {
			return undefined;
		}

		if (importer.instance.progress.step === ProgressStep.DOWNLOADING_FILE_URL) {
			return { waiting: true };
		}

		const fileName = importer.instance.importRecord.file;
		const fullFilePath = path.join(RocketChatImportFileInstance.absolutePath, fileName);
		const results = importer.instance.prepareUsingLocalFile(fullFilePath);

		if (results instanceof Promise) {
			return results.then((data) => {
				importer.instance.updateRecord({
					fileData: data,
				});

				return data;
			}).catch((e) => {
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
