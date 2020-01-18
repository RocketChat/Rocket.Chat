import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Imports } from '../../../models';

import { Importers } from '..';


Meteor.methods({
	getImportProgress(key) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getImportProgress' });
		}

		if (!hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter' });
		}

		const operation = Imports.findLastImport();
		if (!operation) {
			throw new Meteor.Error('error-operation-not-found', 'Import Operation Not Found', { method: 'getImportProgress' });
		}

		if (key !== operation.importerKey) {
			throw new Meteor.Error('error-operation-expired', 'Import Operation is Expired', { method: 'getImportProgress' });
		}

		const importer = Importers.get(key);
		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${ key }) has no import class defined.`, { method: 'getImportProgress' });
		}

		importer.instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

		return importer.instance.getProgress();
	},
});
