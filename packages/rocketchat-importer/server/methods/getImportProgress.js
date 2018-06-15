import { Importers } from 'meteor/rocketchat:importer';

Meteor.methods({
	getImportProgress(key) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getImportProgress' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter'});
		}

		const importer = Importers.get(key);

		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${ key }) has no import class defined.`, { method: 'getImportProgress' });
		}

		if (!importer.instance) {
			return undefined;
		}

		return importer.instance.getProgress();
	}
});
