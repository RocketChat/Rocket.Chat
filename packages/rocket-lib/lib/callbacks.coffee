# https://github.com/TelescopeJS/Telescope/blob/master/packages/telescope-lib/lib/callbacks.js

###
# Callback hooks provide an easy way to add extra steps to common operations. 
# @namespace Rocket.callbacks
###
Rocket.callbacks = {}

###
# Callback priorities
###
Rocket.callbacks.priority = 
	HIGH: -1
	MEDIUM: 0
	LOW: 1

###
# Add a callback function to a hook
# @param {String} hook - The name of the hook
# @param {Function} callback - The callback function
###

Rocket.callbacks.add = (hook, callback, priority) ->
	# if callback array doesn't exist yet, initialize it
	priority ?= Rocket.callbacks.priority.MEDIUM
	unless _.isNumber priority
		priority = Rocket.callbacks.priority.MEDIUM
	callback.priority = priority
	Rocket.callbacks[hook] ?= []
	Rocket.callbacks[hook].push callback
	return

###
# Remove a callback from a hook
# @param {string} hook - The name of the hook
# @param {string} functionName - The name of the function to remove
###

Rocket.callbacks.remove = (hookName, callbackName) ->
	Rocket.callbacks[hookName] = _.reject Rocket.callbacks[hookName], (callback) ->
		callback.name is callbackName
	return

###
# Successively run all of a hook's callbacks on an item
# @param {String} hook - The name of the hook
# @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
# @param {Object} [constant] - An optional constant that will be passed along to each callback
# @returns {Object} Returns the item after it's been through all the callbacks for this hook
###

Rocket.callbacks.run = (hook, item, constant) ->
	callbacks = Rocket.callbacks[hook]
	if !!callbacks?.length
		# if the hook exists, and contains callbacks to run
		_.sortBy(callbacks, (callback) -> return callback.priority or Rocket.callbacks.priority.MEDIUM).reduce (result, callback) ->
			# console.log(callback.name);
			callback result, constant
		, item
	else
		# else, just return the item unchanged
		item

###
# Successively run all of a hook's callbacks on an item, in async mode (only works on server)
# @param {String} hook - The name of the hook
# @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
# @param {Object} [constant] - An optional constant that will be passed along to each callback 
###

Rocket.callbacks.runAsync = (hook, item, constant) ->
	callbacks = Rocket.callbacks[hook]
	if Meteor.isServer and !!callbacks?.length
		# use defer to avoid holding up client
		Meteor.defer ->
			# run all post submit server callbacks on post object successively
			_.sortBy(callbacks, (callback) -> return callback.priority or Rocket.callbacks.priority.MEDIUM).forEach (callback) ->
				# console.log(callback.name);
				callback item, constant
				return
			return
	else
		return item
	return