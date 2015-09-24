Template.adminImport.helpers
	isAdmin: ->
		return RocketChat.authz.hasRole(Meteor.userId(), 'admin')
	isImporters: ->
		return Object.keys(RocketChat.importTool.importers).length > 0
	importers: ->
		importers = []
		_.each RocketChat.importTool.importers, (importer, key) ->
			importer.key = key
			importers.push importer
		console.log importers
		return importers

Template.adminImport.events
	'click .start-import': (event) ->
		importer = @

		console.log importer
