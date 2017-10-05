/* globals Importer */
Meteor.methods({
	getSelectionData(name) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getSelectionData' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter'});
		}

		if ((Importer.Importers[name] != null ? Importer.Importers[name].importerInstance : undefined) != null) {
			const progress = Importer.Importers[name].importerInstance.getProgress();
			switch (progress.step) {
				case Importer.ProgressStep.USER_SELECTION:
					return Importer.Importers[name].importerInstance.getSelection();
				default:
					return false;
			}
		} else {
			throw new Meteor.Error('error-importer-not-defined', 'The importer was not defined correctly, it is missing the Import class.', { method: 'getSelectionData' });
		}
	}});
