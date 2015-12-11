RocketChat.importTool =
	importers: {}

RocketChat.importTool.add = (name, importer, options) ->
	console.log "Adding #{name} to the importTool", arguments
	if not RocketChat.importTool.importers[name]?
		RocketChat.importTool.importers[name] =
			name: options?.name
			importer: importer
			fileTypeRegex: options?.fileTypeRegex
			description: options?.description
			collection: if Meteor.isServer then new RocketChat.models.RawImports name else undefined

if Meteor.isServer
	RocketChat.importTool.setup = (name) ->
		if RocketChat.importTool.importers[name]?.importer?
			importer = RocketChat.importTool.importers[name]
			# Don't want to restart any of their progress
			if not importer.importerInstance
				importer.importerInstance = new RocketChat.importTool.importers[name]?.importer importer.collection

	# Takes name, base64, and contentType string
	RocketChat.importTool.prepare = (name, dataURI, contentType, fileName) ->
		if RocketChat.importTool.importers[name]?.importerInstance?
			prepare = RocketChat.importTool.importers[name].importerInstance.prepare
			return prepare dataURI, contentType, fileName

	# Takes name and object with users / channels selected to import
	RocketChat.importTool.import = (name, input) ->
		if RocketChat.importTool.importers[name]?.importerInstance?
			importer = RocketChat.importTool.importers[name].importerInstance.doImport
			result = importer input
			RocketChat.importTool.importers[name].importerInstance = undefined #clear data
			return result

	RocketChat.importTool.restart = (name) ->
		if RocketChat.importTool.importers[name]?
			RocketChat.importTool.importers[name].importerInstance = undefined
			RocketChat.importTool.setup name
			return

	Meteor.methods
		getImportData: (name) ->
			if not Meteor.userId()
				throw new Meteor.Error 203, t('User_logged_out')

			if RocketChat.importTool.importers[name]?.importerInstance?
				return RocketChat.importTool.importers[name]?.importerInstance?.record
			else
				RocketChat.importTool.setup name
				return false

		setupImport: (name) ->
			if not Meteor.userId()
				throw new Meteor.Error 203, t('User_logged_out')

			RocketChat.importTool.setup name
			return true

		prepareImport: (name, dataURI, contentType, fileName) ->
			if not Meteor.userId()
				throw new Meteor.Error 203, t('User_logged_out')

			return RocketChat.importTool.prepare name, dataURI, contentType, fileName

		startImport: (name, input) ->
			if not Meteor.userId()
				throw new Meteor.Error 203, t('User_logged_out')

			RocketChat.importTool.import name, input

		restartImport: (name) ->
			if not Meteor.userId()
				throw new Meteor.Error 203, t('User_logged_out')

			RocketChat.importTool.restart name
