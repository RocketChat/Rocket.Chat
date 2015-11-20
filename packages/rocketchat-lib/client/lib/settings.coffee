###
# RocketChat.settings holds all packages settings
# @namespace RocketChat.settings
###

@Settings = new Meteor.Collection 'rocketchat_settings'

RocketChat.settings.subscription = Meteor.subscribe 'settings'

RocketChat.settings.dict = new ReactiveDict 'settings'

RocketChat.settings.get = (_id) ->
	return RocketChat.settings.dict.get(_id)

RocketChat.settings.init = ->
	initialLoad = true
	Settings.find().observe
		added: (record) ->
			Meteor.settings[record._id] = record.value
			RocketChat.settings.dict.set record._id, record.value
			RocketChat.settings.load record._id, record.value, initialLoad
		changed: (record) ->
			Meteor.settings[record._id] = record.value
			RocketChat.settings.dict.set record._id, record.value
			RocketChat.settings.load record._id, record.value, initialLoad
		removed: (record) ->
			delete Meteor.settings[record._id]
			RocketChat.settings.dict.set record._id, undefined
			RocketChat.settings.load record._id, undefined, initialLoad
	initialLoad = false

RocketChat.settings.init()
