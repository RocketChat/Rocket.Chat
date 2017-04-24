Meteor.methods
	setupImporter: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'setupImporter' }

		if not RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', { method: 'setupImporter'});

		if Importer.Importers[name]?.importer?
			importer = Importer.Importers[name]
			# If they currently have progress, get it and return the progress.
			if importer.importerInstance
				return importer.importerInstance.getProgress()
			else
				importer.importerInstance = new importer.importer importer.name, importer.description, importer.mimeType
				return importer.importerInstance.getProgress()
		else
			console.warn "Tried to setup #{name} as an importer."
			throw new Meteor.Error 'error-importer-not-defined', 'The importer was not defined correctly, it is missing the Import class.', { method: 'setupImporter' }
