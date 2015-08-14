###
# RocketChat.settings holds all packages settings
# @namespace RocketChat.settings
###

settingsDict = new ReactiveDict('settings')

RocketChat.settings.get = (_id) ->
	return settingsDict.get(_id)

RocketChat.settings.load = (key, value) ->
	return settingsDict.set key, value