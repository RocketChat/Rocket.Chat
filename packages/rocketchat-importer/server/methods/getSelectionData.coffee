Meteor.methods
	getSelectionData: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out') #TODO: Update this to the new way of doing things

		if Importer.Importers[name]?.importerInstance?
			progress = Importer.Importers[name].importerInstance.getProgress()
			switch progress.step
				when Importer.ProgressStep.USER_SELECTION
					return Importer.Importers[name].importerInstance.getSelection()
				else
					return false
