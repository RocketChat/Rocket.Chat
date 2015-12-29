Meteor.methods
	getImportProgress: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, 'User_logged_out' #TODO: Update this to the new way of doing things

		if Importer.Importers[name]?
			return Importer.Importers[name].importerInstance?.getProgress()
		else
			throw new Meteor.Error 'importer-not-defined', 'importer_not_defined_properly', { importerName: name }
