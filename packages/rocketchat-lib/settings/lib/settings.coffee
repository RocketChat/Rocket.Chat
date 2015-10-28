if Meteor.isClient is true
	@Settings = Settings = new Meteor.Collection 'rocketchat_settings'
else
	Settings = RocketChat.models.Settings

initialLoad = true
Settings.find().observe
	added: (record) ->
		Meteor.settings ?= {}
		Meteor.settings[record._id] = record.value

		RocketChat.settings.load record._id, record.value, initialLoad

		if process?
			process.env ?= {}
			process.env[record._id] = record.value

	changed: (record) ->
		Meteor.settings?[record._id] = record.value

		RocketChat.settings.load record._id, record.value, initialLoad

		if process?
			process.env[record._id] = record.value

	removed: (record) ->
		RocketChat.settings.load record._id, undefined, initialLoad

		delete Meteor.settings?[record._id]
		delete process?.env?[record._id]

initialLoad = false
