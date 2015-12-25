Meteor.methods
	getImportProgress: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out') #TODO: Update this to the new way of doing things

		if Importer.Importers[name]?.importerInstance?
			return Importer.Importers[name]?.importerInstance?.getProgress()
