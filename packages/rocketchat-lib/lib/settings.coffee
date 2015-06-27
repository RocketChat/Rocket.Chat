###
# Setting hooks provide an easy way to add extra steps to common operations.
# @namespace RocketChat.settings
###
RocketChat.settings = {}

###
# Setting priorities
###
RocketChat.settings.priority =
	HIGH: -1000
	MEDIUM: 0
	LOW: 1000

###
# Add a setting function to a hook
# @param {String} hook - The name of the hook
# @param {Function} setting - The setting function
###

RocketChat.settings.add = (hook, setting, priority) ->
	# if setting array doesn't exist yet, initialize it
	priority ?= RocketChat.settings.priority.MEDIUM
	unless _.isNumber priority
		priority = RocketChat.settings.priority.MEDIUM
	setting.priority = priority
	RocketChat.settings[hook] ?= []
	RocketChat.settings[hook].push setting
	return

RocketChat.settings.startup = (hook, setting, priority) ->
	return
