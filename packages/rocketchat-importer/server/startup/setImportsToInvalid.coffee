Meteor.startup ->
	Importer.Imports.update {}, { $set: { valid: false } }, { multi: true }

	Importer.Imports.find({ valid: { $ne: true }}).forEach (item) ->
		Importer.RawImports.remove { 'import': item._id, 'importer': item.type }
