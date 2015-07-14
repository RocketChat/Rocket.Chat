###
# RocketChat.settings holds all packages settings
# @namespace RocketChat.settings
###
@Settings = new Meteor.Collection 'settings'

RocketChat.settings = {}

RocketChat.settings.get = (_id) ->
	return Settings.findOne(_id)
