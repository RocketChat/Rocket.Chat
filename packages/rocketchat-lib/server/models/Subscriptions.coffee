RocketChat.models.Subscriptions = new class asd extends RocketChat.models._Base
RocketChat.models.Subscriptions = new class asd extends RocketChat.models._Base
	constructor: ->
		@model = new Meteor.Collection 'rocketchat_subscription'


	# FIND
	findByUserId: (userId, options) ->
		query =
			"u._id": userId

		return @find query, options


	# UPDATE
	archiveByRoomIdAndUserId: (roomId, userId) ->
		query =
			rid: roomId
			'u._id': userId

		update =
			$set:
				alert: false
				open: false
				archived: true

		return @update query, update

	unarchiveByRoomIdAndUserId: (roomId, userId) ->
		query =
			rid: roomId
			'u._id': userId

		update =
			$set:
				alert: false
				open: false
				archived: false

		return @update query, update

	hideByRoomIdAndUserId: (roomId, userId) ->
		query =
			rid: roomId
			'u._id': userId

		update =
			$set:
				alert: false
				open: false

		return @update query, update

	openByRoomIdAndUserId: (roomId, userId) ->
		query =
			rid: roomId
			'u._id': userId

		update =
			$set:
				open: true

		return @update query, update

	setAsReadByRoomIdAndUserId: (roomId, userId) ->
		query =
			rid: roomId
			'u._id': userId

		update =
			$set:
				open: true
				alert: false
				unread: 0
				ls: new Date

		return @update query, update

	setFavoriteByRoomIdAndUserId: (roomId, userId, favorite=true) ->
		query =
			rid: roomId
			'u._id': userId

		update =
			$set:
				f: favorite

		return @update query, update

	updateNameByRoomId: (roomId, name) ->
		query =
			rid: roomId

		update =
			$set:
				name: name
				alert: true

		return @update query, update, { multi: true }

	# INSERT
	createWithRoomAndUser: (room, user, extraData) ->
		subscription =
			open: false
			alert: false
			unread: 0
			ts: room.ts
			rid: room._id
			name: room.name
			t: room.t
			u:
				_id: user._id
				username: user.username

		_.extend subscription, extraData

		return @insert subscription


	# REMOVE
	removeByUserId: (userId) ->
		query =
			"u._id": userId

		return @remove query

	removeByRoomId: (roomId) ->
		query =
			rid: roomId

		return @remove query

	removeByRoomIdAndUserId: (roomId, userId) ->
		query =
			rid: roomId
			"u._id": userId

		return @remove query
