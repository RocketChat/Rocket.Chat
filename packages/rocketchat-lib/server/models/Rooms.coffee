RocketChat.models.Rooms = new class asd extends RocketChat.models._Base
	constructor: ->
		@model = new Meteor.Collection 'rocketchat_room'

		@tryEnsureIndex { 'name': 1 }, { unique: 1, sparse: 1 }
		@tryEnsureIndex { 'u._id': 1 }


	# FIND ONE
	findOneById: (_id, options) ->
		query =
			_id: _id

		return @findOne query, options

	findOneByName: (name, options) ->
		query =
			name: name

		return @findOne query, options

	findOneByNameAndType: (name, type, options) ->
		query =
			name: name
			t: type

		return @findOne query, options

	findOneByIdContainigUsername: (_id, username, options) ->
		query =
			_id: _id
			usernames: username

		return @findOne query, options

	findOneByNameAndTypeNotContainigUsername: (name, type, username, options) ->
		query =
			name: name
			t: type
			usernames:
				$ne: username

		return @findOne query, options

	# # FIND
	# findByUserId: (userId, options) ->
	# 	query =
	# 		"u._id": userId

	# 	return @find query, options


	# # UPDATE
	# archiveByRoomIdAndUserId: (roomId, userId) ->
	# 	query =
	# 		rid: roomId
	# 		'u._id': userId

	# 	update =
	# 		$set:
	# 			alert: false
	# 			open: false
	# 			archived: true

	# 	return @update query, update


	# # INSERT
	# createWithRoomAndUser: (room, user, extraData) ->
	# 	subscription =
	# 		open: false
	# 		alert: false
	# 		unread: 0
	# 		ts: room.ts
	# 		rid: room._id
	# 		name: room.name
	# 		t: room.t
	# 		u:
	# 			_id: user._id
	# 			username: user.username

	# 	_.extend subscription, extraData

	# 	return @insert subscription


	# # REMOVE
	# removeByUserId: (userId) ->
	# 	query =
	# 		"u._id": userId

	# 	return @remove query
