###
# RocketChat.settings holds all packages settings
# @namespace RocketChat.settings
###
RocketChat.settings =
	callbacks: {}
	regexCallbacks: {}
	ts: new Date

	get: (_id, callback) ->
		if callback?
			RocketChat.settings.onload _id, callback
			if _id is '*' and Meteor.settings?
				for key, value of Meteor.settings
					callback key, value
				return

			if _.isRegExp(_id)
				for key, value of Meteor.settings when _id.test(key)
					callback key, value
				return

			if Meteor.settings?[_id]?
				callback _id, Meteor.settings?[_id]
		else
			if _.isRegExp(_id)
				items = []
				for key, value of Meteor.settings when _id.test(key)
					items.push
						key: key
						value: value
				return items

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

		for cbKey, cbValue of RocketChat.settings.regexCallbacks
			if cbValue.regex.test(key)
				callback(key, value, initialLoad) for callback in cbValue.callbacks


	onload: (key, callback) ->
		# if key is '*'
		# 	for key, value in Meteor.settings
		# 		callback key, value, false
		# else if Meteor.settings?[_id]?
		# 	callback key, Meteor.settings[_id], false

		keys = [].concat key

		for k in keys
			if _.isRegExp k
				RocketChat.settings.regexCallbacks[k.source] ?= {
					regex: k
					callbacks: []
				}
				RocketChat.settings.regexCallbacks[k.source].callbacks.push callback
			else
				RocketChat.settings.callbacks[k] ?= []
				RocketChat.settings.callbacks[k].push callback
