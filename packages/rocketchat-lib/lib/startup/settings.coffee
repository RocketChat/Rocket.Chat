@Settings = Settings = new Meteor.Collection 'rocketchat_settings'
initialLoad = true
Settings.find().observe
	added: (record) ->
		Meteor.settings[record._id] = record.value
		RocketChat.settings.load record._id, record.value, initialLoad
	changed: (record) ->
		Meteor.settings[record._id] = record.value
		RocketChat.settings.load record._id, record.value, initialLoad
	removed: (record) ->
		delete Meteor.settings[record._id]
		RocketChat.settings.load record._id, undefined, initialLoad
initialLoad = false
