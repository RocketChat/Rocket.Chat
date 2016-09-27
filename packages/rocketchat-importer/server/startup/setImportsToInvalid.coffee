Meteor.startup ->
	# Make sure all imports are marked as invalid, data clean up since you can't
	# restart an import at the moment.
	Importer.Imports.update { valid: { $ne: false } }, { $set: { valid: false } }, { multi: true }

	# Clean up all the raw import data, since you can't restart an import at the moment
	Importer.Imports.find({ valid: { $ne: true }}).forEach (item) ->
		Importer.RawImports.remove { 'import': item._id, 'importer': item.type }
