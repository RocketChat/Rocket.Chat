Meteor.methods
	getImportProgress: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'getImportProgress' }

		if Importer.Importers[name]?
			return Importer.Importers[name].importerInstance?.getProgress()
		else
			throw new Meteor.Error 'error-importer-not-defined', 'The importer was not defined correctly, it is missing the Import class.', { method: 'getImportProgress' }
