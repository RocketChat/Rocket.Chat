@Settings = new Meteor.Collection 'rocketchat_settings'

Settings.find().observe
	added: (record) ->
		Meteor.settings ?= {}
		Meteor.settings[record._id] = record.value

		if Meteor.isClient is true
			RocketChat.settings.load record._id, record.value

		if process?
			process.env ?= {}
			process.env[record._id] = record.value

	changed: (record) ->
		Meteor.settings?[record._id] = record.value

		if Meteor.isClient is true
			RocketChat.settings.load record._id, record.value

		if process?
			process.env[record._id] = record.value

	removed: (record) ->
		if Meteor.isClient is true
			RocketChat.settings.load record._id, undefined

		delete Meteor.settings?[record._id]
		delete process?.env?[record._id]
