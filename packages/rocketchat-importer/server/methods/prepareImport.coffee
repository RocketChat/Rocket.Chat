Meteor.methods
	prepareImport: (name, dataURI, contentType, fileName) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'prepareImport' }

		if Importer.Importers[name]?.importerInstance?
			Importer.Importers[name].importerInstance.prepare dataURI, contentType, fileName
		else
			throw new Meteor.Error 'error-importer-not-defined', 'The importer was not defined correctly, it is missing the Import class.', { method: 'prepareImport' }
