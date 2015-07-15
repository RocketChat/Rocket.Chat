@Settings = new Meteor.Collection 'settings'

Settings.find().observe
	added: (record) ->
		Meteor.settings ?= {}
		Meteor.settings[record._id] = record.value
		
		if process?
			process.env ?= {}
			process.env[record._id] = record.value

	changed: (record) ->
		Meteor.settings?[record._id] = record.value
		if process?
			process.env[record._id] = record.value

	removed: (record) ->
		delete Meteor.settings?[record._id]
		delete process?.env?[record._id]
