import { Meteor } from 'meteor/meteor';
import {
	Importers,
	ProgressStep,
} from '..';
import { hasPermission } from '../../../authorization';

Meteor.methods({
	restartImport(key) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'restartImport' });
		}

		if (!hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter' });
		}

		const importer = Importers.get(key);

		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${ key }) has no import class defined.`, { method: 'restartImport' });
		}

		if (importer.instance) {
			if (importer.instance.importRecord) {
				importer.instance.updateProgress(ProgressStep.CANCELLED);
				importer.instance.updateRecord({ valid: false });
			}
			importer.instance = undefined;
		}

		importer.instance = new importer.importer(importer); // eslint-disable-line new-cap
		return importer.instance.getProgress();
	},
});
