RocketChat.models.Subscriptions = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'subscription'

		@tryEnsureIndex { 'rid': 1, 'u._id': 1 }, { unique: 1 }
		@tryEnsureIndex { 'rid': 1, 'roles': 1 }
		@tryEnsureIndex { 'u._id': 1, 'name': 1, 't': 1 }, { unique: 1 }
		@tryEnsureIndex { 'open': 1 }
		@tryEnsureIndex { 'alert': 1 }
		@tryEnsureIndex { 'unread': 1 }
		@tryEnsureIndex { 'ts': 1 }
		@tryEnsureIndex { 'ls': 1 }
		@tryEnsureIndex { 'desktopNotifications': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'mobilePushNotifications': 1 }, { sparse: 1 }


	# FIND ONE
	findOneByRoomIdAndUserId: (roomId, userId) ->
		query =
			rid: roomId
			"u._id": userId

		return @findOne query

	# FIND
	findByUserId: (userId, options) ->
		query =
			"u._id": userId

		return @find query, options

	# FIND
	findByRoomIdAndRoles: (roomId, roles, options) ->
		roles = [].concat roles
		query =
			"rid": roomId
			"roles": { $in: roles }

		return @find query, options

	findByType: (types, options) ->
		query =
			t:
				$in: types

		return @find query, options

	findByNameContainingAndTypes: (name, types, options) ->
		nameRegex = new RegExp s.trim(s.escapeRegExp(name)), "i"

		query =
			t:
				$in: types
				name: nameRegex

		return @find query, options

	getLastSeen: (options = {}) ->
		query = { ls: { $exists: 1 } }
		options.sort = { ls: -1 }
		options.limit = 1

		return @find(query, options)?.fetch?()?[0]?.ls

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
				open: true
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

	setUserUsernameByUserId: (userId, username) ->
		query =
			"u._id": userId

		update =
			$set:
				"u.username": username

		return @update query, update, { multi: true }

	setNameForDirectRoomsWithOldName: (oldName, name) ->
		query =
			name: oldName
			t: "d"

		update =
			$set:
				name: name

		return @update query, update, { multi: true }

	incUnreadOfDirectForRoomIdExcludingUserId: (roomId, userId, inc=1) ->
		query =
			rid: roomId
			t: 'd'
			'u._id':
				$ne: userId

		update =
			$set:
				alert: true
				open: true
			$inc:
				unread: inc

		return @update query, update, { multi: true }

	incUnreadForRoomIdExcludingUserId: (roomId, userId, inc=1) ->
		query =
			rid: roomId
			'u._id':
				$ne: userId

		update =
			$set:
				alert: true
				open: true
			$inc:
				unread: inc

		return @update query, update, { multi: true }

	incUnreadForRoomIdAndUserIds: (roomId, userIds, inc=1) ->
		query =
			rid: roomId
			'u._id':
				$in: userIds

		update =
			$set:
				alert: true
				open: true
			$inc:
				unread: inc

		return @update query, update, { multi: true }

	setAlertForRoomIdExcludingUserId: (roomId, userId, alert=true) ->
		query =
			rid: roomId
			alert:
				$ne: alert
			'u._id':
				$ne: userId

		update =
			$set:
				alert: alert
				open: true

		return @update query, update, { multi: true }

	updateTypeByRoomId: (roomId, type) ->
		query =
			rid: roomId

		update =
			$set:
				t: type

		return @update query, update, { multi: true }

	addRoleById: (_id, role) ->
		query =
			_id: _id

		update =
			$addToSet:
				roles: role

		return @update query, update

	removeRoleById: (_id, role) ->
		query =
			_id: _id

		update =
			$pull:
				roles: role

		return @update query, update

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
