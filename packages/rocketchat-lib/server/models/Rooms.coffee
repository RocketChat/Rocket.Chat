RocketChat.models.Rooms = new class asd extends RocketChat.models._Base
	constructor: ->
		# @model = new Meteor.Collection 'rocketchat_room'
		@model = @ChatRoom

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


	# FIND
	findByType: (type, options) ->
		query =
			t: type

		return @find query, options

	findByTypes: (types, options) ->
		query =
			t:
				$in: types

		return @find query, options

	findByUserId: (userId, options) ->
		query =
			"u._id": userId

		return @find query, options

	findByNameContaining: (name, options) ->
		nameRegex = new RegExp name, "i"

		query =
			$or: [
				name: nameRegex
			,
				t: 'd'
				usernames: nameRegex
			]

		return @find query, options

	findByNameContainingAndTypes: (name, types, options) ->
		nameRegex = new RegExp name, "i"

		query =
			t:
				$in: types
			$or: [
				name: nameRegex
			,
				t: 'd'
				usernames: nameRegex
			]

		return @find query, options

	findByDefaultAndTypes: (defaultValue, types, options) ->
		query =
			default: defaultValue
			t:
				$in: types

		return @find query, options

	findByTypeContainigUsername: (type, username, options) ->
		query =
			t: type
			usernames: username

		return @find query, options

	findByTypesAndNotUserIdContainingUsername: (types, userId, username, options) ->
		query =
			t:
				$in: types
			uid:
				$ne: userId
			usernames: username

		return @find query, options

	findByContainigUsername: (username, options) ->
		query =
			usernames: username

		return @find query, options

	findByTypeAndName: (type, name, options) ->
		query =
			t: type
			name: name

		return @find query, options

	findByTypeAndNameContainigUsername: (type, name, username, options) ->
		query =
			t: type
			name: name
			usernames: username

		return @find query, options

	findByVisitorToken: (visitorToken, options) ->
		query =
			"v.token": visitorToken

		return @find query, options


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


	# REMOVE
	removeById: (_id) ->
		query =
			_id: _id

		return @remove query

	removeByTypeContainingUsername: (type, username) ->
		query =
			t: type
			username: username

		return @remove query
