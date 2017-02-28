# https://github.com/TelescopeJS/Telescope/blob/master/packages/telescope-lib/lib/callbacks.js

###
# Callback hooks provide an easy way to add extra steps to common operations.
# @namespace RocketChat.callbacks
###
RocketChat.callbacks = {}

if Meteor.isServer
	RocketChat.callbacks.showTime = true
	RocketChat.callbacks.showTotalTime = true
else
	RocketChat.callbacks.showTime = false
	RocketChat.callbacks.showTotalTime = false

###
# Callback priorities
###
RocketChat.callbacks.priority =
	HIGH: -1000
	MEDIUM: 0
	LOW: 1000

###
# Add a callback function to a hook
# @param {String} hook - The name of the hook
# @param {Function} callback - The callback function
###
RocketChat.callbacks.add = (hook, callback, priority, id) ->
	# if callback array doesn't exist yet, initialize it
	priority ?= RocketChat.callbacks.priority.MEDIUM
	unless _.isNumber priority
		priority = RocketChat.callbacks.priority.MEDIUM
	callback.priority = priority
	callback.id = id or Random.id()
	RocketChat.callbacks[hook] ?= []

	if RocketChat.callbacks.showTime is true
		err = new Error
		callback.stack = err.stack

		# if not id?
		# 	console.log('Callback without id', callback.stack)

	# Avoid adding the same callback twice
	for cb in RocketChat.callbacks[hook]
		if cb.id is callback.id
			return

	RocketChat.callbacks[hook].push callback
	return

###
# Remove a callback from a hook
# @param {string} hook - The name of the hook
# @param {string} id - The callback's id
###

RocketChat.callbacks.remove = (hookName, id) ->
	RocketChat.callbacks[hookName] = _.reject RocketChat.callbacks[hookName], (callback) ->
		callback.id is id
	return

###
# Successively run all of a hook's callbacks on an item
# @param {String} hook - The name of the hook
# @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
# @param {Object} [constant] - An optional constant that will be passed along to each callback
# @returns {Object} Returns the item after it's been through all the callbacks for this hook
###

RocketChat.callbacks.run = (hook, item, constant) ->
	callbacks = RocketChat.callbacks[hook]
	if !!callbacks?.length
		if RocketChat.callbacks.showTotalTime is true
			totalTime = 0

		# if the hook exists, and contains callbacks to run
		result = _.sortBy(callbacks, (callback) -> return callback.priority or RocketChat.callbacks.priority.MEDIUM).reduce (result, callback) ->
			# console.log(callback.name);
			if RocketChat.callbacks.showTime is true or RocketChat.callbacks.showTotalTime is true
				time = Date.now()

			callbackResult = callback result, constant

			if RocketChat.callbacks.showTime is true or RocketChat.callbacks.showTotalTime is true
				currentTime = Date.now() - time
				totalTime += currentTime
				if RocketChat.callbacks.showTime is true
					if Meteor.isServer
						RocketChat.statsTracker.timing('callbacks.time', currentTime, ["hook:#{hook}", "callback:#{callback.id}"]);
					else
						console.log String(currentTime), hook, callback.id, callback.stack?.split?('\n')[2]?.match(/\(.+\)/)?[0]

			return if typeof callbackResult == 'undefined' then result else callbackResult
		, item

		if RocketChat.callbacks.showTotalTime is true
			if Meteor.isServer
				RocketChat.statsTracker.timing('callbacks.totalTime', totalTime, ["hook:#{hook}"]);
			else
				console.log hook+':', totalTime

		return result
	else
		# else, just return the item unchanged
		return item

###
# Successively run all of a hook's callbacks on an item, in async mode (only works on server)
# @param {String} hook - The name of the hook
# @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
# @param {Object} [constant] - An optional constant that will be passed along to each callback
###

RocketChat.callbacks.runAsync = (hook, item, constant) ->
	callbacks = RocketChat.callbacks[hook]
	if Meteor.isServer and !!callbacks?.length
		# use defer to avoid holding up client
		Meteor.defer ->
			# run all post submit server callbacks on post object successively
			_.sortBy(callbacks, (callback) -> return callback.priority or RocketChat.callbacks.priority.MEDIUM).forEach (callback) ->
				# console.log(callback.name);
				callback item, constant
				return
			return
	else
		return item
	return
