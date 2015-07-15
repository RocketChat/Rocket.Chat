###
# RocketChat.settings holds all packages settings
# @namespace RocketChat.settings
###
RocketChat.settings = {}

RocketChat.settings.get = (_id) ->
	return Meteor.settings?[_id]
