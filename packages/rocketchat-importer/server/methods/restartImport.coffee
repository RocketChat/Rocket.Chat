Meteor.methods
	restartImport: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, 'User_logged_out' #TODO: Update this to the new way of doing things

		if Importer.Importers[name]?
			importer = Importer.Importers[name]
			importer.importerInstance.updateProgress Importer.ProgressStep.CANCELLED
			importer.importerInstance.updateRecord { valid: false }
			importer.importerInstance = undefined
			importer.importerInstance = new importer.importer importer.name, importer.description, importer.fileTypeRegex
			return importer.importerInstance.getProgress()
		else
			throw new Meteor.Error 'importer-not-defined', 'importer_not_defined_properly', { importerName: name }
