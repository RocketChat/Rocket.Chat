###
# RocketChat.settings holds all packages settings
# @namespace RocketChat.settings
###
RocketChat.settings = {}

RocketChat.settings.get = (_id) ->
	return Meteor.settings?[_id]

RocketChat.settings.set = (_id, value, callback) ->
	Meteor.call 'saveSetting', _id, value, callback

RocketChat.settings.batchSet = (settings, callback) ->

	# async -> sync
	# http://daemon.co.za/2012/04/simple-async-with-only-underscore/

	save = (setting) ->
		return (callback) ->
			Meteor.call 'saveSetting', setting._id, setting.value, callback

	actions = _.map settings, (setting) -> save(setting)
	_(actions).reduceRight(_.wrap, (err, success) -> return callback err, success)()