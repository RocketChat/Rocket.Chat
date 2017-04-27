Meteor.methods
	getSelectionData: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'getSelectionData' }

		if not RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter'});

		if Importer.Importers[name]?.importerInstance?
			progress = Importer.Importers[name].importerInstance.getProgress()
			switch progress.step
				when Importer.ProgressStep.USER_SELECTION
					return Importer.Importers[name].importerInstance.getSelection()
				else
					return false
		else
			throw new Meteor.Error 'error-importer-not-defined', 'The importer was not defined correctly, it is missing the Import class.', { method: 'getSelectionData' }
