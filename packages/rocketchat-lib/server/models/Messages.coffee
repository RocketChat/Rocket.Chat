RocketChat.models.Messages = new class asd extends RocketChat.models._Base
	constructor: ->
		# @model = new Meteor.Collection 'rocketchat_message'
		@model = @ChatMessage

		@tryEnsureIndex { 'rid': 1, 'ts': 1 }
		@tryEnsureIndex { 'ets': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'rid': 1, 't': 1, 'u._id': 1 }
		@tryEnsureIndex { 'expireAt': 1 }, { expireAfterSeconds: 0 }
		@tryEnsureIndex { 'msg': 'text' }


	# FIND ONE
	findOneById: (_id, options) ->
		query =
			_id: _id

		return @findOne query, options

	# # FIND
	# findByType: (type, options) ->
	# 	query =
	# 		t: type

	# 	return @find query, options


	# # UPDATE
	# archiveById: (_id) ->
	# 	query =
	# 		_id: _id

	# 	update =
	# 		$set:
	# 			archived: true

	# 	return @update query, update


	# # INSERT
	# createWithTypeNameUserAndUsernames: (type, name, user, usernames, extraData) ->
	# 	room =
	# 		t: type
	# 		name: name
	# 		usernames: usernames
	# 		msgs: 0
	# 		u:
	# 			_id: user._id
	# 			username: user.username

	# 	_.extend room, extraData

	# 	room._id = @insert room
	# 	return room


	# # REMOVE
	# removeById: (_id) ->
	# 	query =
	# 		_id: _id

	# 	return @remove query
