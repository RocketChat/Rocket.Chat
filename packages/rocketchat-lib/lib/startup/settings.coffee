if Meteor.isClient is true
	@Settings = Settings = new Meteor.Collection 'rocketchat_settings'
else
	Settings = RocketChat.models.Settings

initialLoad = true

Meteor.settings ?= {}

process?.env ?= {}

Settings.find().observe

	added: (record) ->
		Meteor.settings[record._id] = record.value
		process?.env[record._id] = record.value
		RocketChat.settings.load record._id, record.value, initialLoad

	changed: (record) ->
		Meteor.settings?[record._id] = record.value
		process?.env[record._id] = record.value
		RocketChat.settings.load record._id, record.value, initialLoad

	removed: (record) ->
		delete Meteor.settings?[record._id]
		delete process?.env?[record._id]
		RocketChat.settings.load record._id, undefined, initialLoad

initialLoad = false
