###
# RocketChat.settings holds all packages settings
# @namespace RocketChat.settings
###
RocketChat.settings =
	callbacks: {}
	ts: new Date

	get: (_id) ->
		return Meteor.settings?[_id]

	set: (_id, value, callback) ->
		Meteor.call 'saveSetting', _id, value, callback

	batchSet: (settings, callback) ->

		# async -> sync
		# http://daemon.co.za/2012/04/simple-async-with-only-underscore/

		save = (setting) ->
			return (callback) ->
				Meteor.call 'saveSetting', setting._id, setting.value, callback

		actions = _.map settings, (setting) -> save(setting)
		_(actions).reduceRight(_.wrap, (err, success) -> return callback err, success)()

	load: (key, value, initialLoad) ->
		if RocketChat.settings.callbacks[key]?
			for callback in RocketChat.settings.callbacks[key]
				callback key, value, initialLoad

		if RocketChat.settings.callbacks['*']?
			for callback in RocketChat.settings.callbacks['*']
				callback key, value, initialLoad


	onload: (key, callback) ->
		RocketChat.settings.callbacks[key] ?= []
		RocketChat.settings.callbacks[key].push callback
