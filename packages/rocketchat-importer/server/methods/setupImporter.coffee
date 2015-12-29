Meteor.methods
	setupImporter: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, 'User_logged_out' #TODO: Update this to the new way of doing things

		if Importer.Importers[name]?.importer?
			importer = Importer.Importers[name]
			# If they currently have progress, get it and return the progress.
			if importer.importerInstance
				return importer.importerInstance.getProgress()
			else
				importer.importerInstance = new importer.importer importer.name, importer.description, importer.fileTypeRegex
				return importer.importerInstance.getProgress()
		else
			console.warn "Tried to setup #{name} as an importer."
			throw new Meteor.Error 'importer-not-defined', 'importer_not_defined_properly', { importerName: name }
