/* globals Importer */
Meteor.methods({
	getImportProgress(name) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getImportProgress' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter'});
		}

		if (Importer.Importers[name] != null) {
			return (Importer.Importers[name].importerInstance != null ? Importer.Importers[name].importerInstance.getProgress() : undefined);
		} else {
			throw new Meteor.Error('error-importer-not-defined', 'The importer was not defined correctly, it is missing the Import class.', { method: 'getImportProgress' });
		}
	}});
