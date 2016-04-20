Meteor.methods
	restartImport: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'restartImport' }

		if Importer.Importers[name]?
			importer = Importer.Importers[name]
			importer.importerInstance.updateProgress Importer.ProgressStep.CANCELLED
			importer.importerInstance.updateRecord { valid: false }
			importer.importerInstance = undefined
			importer.importerInstance = new importer.importer importer.name, importer.description, importer.fileTypeRegex
			return importer.importerInstance.getProgress()
		else
			throw new Meteor.Error 'error-importer-not-defined', 'The importer was not defined correctly, it is missing the Import class.', { method: 'restartImport' }
