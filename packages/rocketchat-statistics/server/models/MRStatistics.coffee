RocketChat.models.MRStatistics = new class asd extends RocketChat.models._Base
	constructor: ->
		@model = new Meteor.Collection 'rocketchat_mr_statistics'

	# FIND ONE
	findOneById: (_id, options) ->
		query =
			_id: _id

		return @findOne query, options

	# # FIND
	# findByMention: (username, options) ->
	# 	query =
	# 		"mentions.username": username

	# 	return @find query, options


	# # UPDATE
	# setHiddenById: (_id, hidden=true) ->
	# 	query =
	# 		_id: _id

	# 	update =
	# 		$set:
	# 			_hidden: hidden

	# 	return @update query, update


	# # INSERT
	# createWithTypeRoomIdMessageAndUser: (type, roomId, message, user, extraData) ->
	# 	record =
	# 		t: type
	# 		rid: roomId
	# 		ts: new Date
	# 		msg: message
	# 		u:
	# 			_id: user._id
	# 			username: user.username

	# 	_.extend record, extraData

	# 	record._id = @insert record
	# 	return record


	# # REMOVE
	# removeById: (_id) ->
	# 	query =
	# 		_id: _id

	# 	return @remove query
