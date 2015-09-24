RocketChat.importTool =
	importers: {}

RocketChat.importTool.add = (name, importer, options) ->
	if not RocketChat.importTool.importers[name]?
		RocketChat.importTool.importers[name] =
			name: options?.name
			importer: importer
			fileType: options?.fileType
			description: options?.description

	return

RocketChat.importTool.setup = (name) ->
	if RocketChat.importTool.importers[name]?.importer?
		importer = RocketChat.importTool.importers[name]?.importer()
		RocketChat.importTool.importers[name].importerInstance = importer

# Takes name and a file stream
RocketChat.importTool.prepare = (name, file) ->
	if RocketChat.importTool.importers[name]?.importerInstance?
		prepare = RocketChat.importTool.importers[name].importerInstance.prepare
		prepare name, file

# Takes name and object with users / channels selected to import
RocketChat.importTool.import = (name, input) ->
	if RocketChat.importTool.importers[name]?.importerInstance?
		importer = RocketChat.importTool.importers[name].importerInstance.import
		importer name, input

Meteor.methods
	setupImport: (name) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out')

		RocketChat.importTool.setup name

	prepareImport: (name, file) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out')

		RocketChat.importTool.prepare name, file

	startImport: (name, input) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out')

		RocketChat.importTool.import name, input
