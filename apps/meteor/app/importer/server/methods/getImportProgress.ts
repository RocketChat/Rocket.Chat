import type { IImportProgress } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { Imports } from '../../../models/server';
import { Importers } from '..';

export const executeGetImportProgress = (): IImportProgress => {
	const operation = Imports.findLastImport();
	if (!operation) {
		throw new Meteor.Error('error-operation-not-found', 'Import Operation Not Found', 'getImportProgress');
	}

	const { importerKey } = operation;
	const importer = Importers.get(importerKey);
	if (!importer) {
		throw new Meteor.Error('error-importer-not-defined', `The importer (${importerKey}) has no import class defined.`, 'getImportProgress');
	}

	importer.instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

	return importer.instance.getProgress();
};

Meteor.methods({
	getImportProgress() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', 'getImportProgress');
		}

		if (!hasPermission(userId, 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', 'setupImporter');
		}

		return executeGetImportProgress();
	},
});
