Meteor.methods
	prepareImport: (name, dataURI, contentType, fileName) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out') #TODO: Update this to the new way of doing things

		if Importer.Importers[name]?.importerInstance?
			Importer.Importers[name].importerInstance.prepare dataURI, contentType, fileName
		else
			throw new Error(t('importer_not_defined_properly'))
