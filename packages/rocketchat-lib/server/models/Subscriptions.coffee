class ModelSubscriptions extends RocketChat.models._Base
	constructor: ->
		super(arguments...)

		@tryEnsureIndex { 'rid': 1, 'u._id': 1 }, { unique: 1 }
		@tryEnsureIndex { 'rid': 1, 'alert': 1, 'u._id': 1 }
		@tryEnsureIndex { 'rid': 1, 'roles': 1 }
		@tryEnsureIndex { 'u._id': 1, 'name': 1, 't': 1 }
		@tryEnsureIndex { 'u._id': 1, 'name': 1, 't': 1, 'code': 1 }, { unique: 1 }
		@tryEnsureIndex { 'open': 1 }
		@tryEnsureIndex { 'alert': 1 }
		@tryEnsureIndex { 'unread': 1 }
		@tryEnsureIndex { 'ts': 1 }
		@tryEnsureIndex { 'ls': 1 }
		@tryEnsureIndex { 'audioNotification': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'desktopNotifications': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'mobilePushNotifications': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'emailNotifications': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'autoTranslate': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'autoTranslateLanguage': 1 }, { sparse: 1 }

		this.cache.ensureIndex('rid', 'array')
		this.cache.ensureIndex('u._id', 'array')
		this.cache.ensureIndex(['rid', 'u._id'], 'unique')
		this.cache.ensureIndex(['name', 'u._id'], 'unique')


	# FIND ONE
	findOneByRoomIdAndUserId: (roomId, userId) ->
		if this.useCache
			return this.cache.findByIndex('rid,u._id', [roomId, userId]).fetch()
		query =
			rid: roomId
			"u._id": userId

		return @findOne query

	findOneByRoomNameAndUserId: (roomName, userId) ->
		if this.useCache
			return this.cache.findByIndex('name,u._id', [roomName, userId]).fetch()
		query =
			name: roomName
			"u._id": userId

		return @findOne query

	# FIND
	findByUserId: (userId, options) ->
		if this.useCache
			return this.cache.findByIndex('u._id', userId, options)

		query =
			"u._id": userId

		return @find query, options

	findByUserIdUpdatedAfter: (userId, updatedAt, options) ->
		query =
			"u._id": userId
			_updatedAt:
				$gt: updatedAt

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

	findByTypeAndUserId: (type, userId, options) ->
		query =
			t: type
			'u._id': userId

		return @find query, options

	findByTypeNameAndUserId: (type, name, userId, options) ->
		query =
			t: type
			name: name
			'u._id': userId

		return @find query, options

	findByRoomId: (roomId, options) ->
		if this.useCache
			return this.cache.findByIndex('rid', roomId, options)

		query =
			rid: roomId

		return @find query, options

	findByRoomIdAndNotUserId: (roomId, userId, options) ->
		query =
			rid: roomId
			'u._id':
				$ne: userId

		return @find query, options

	getLastSeen: (options = {}) ->
		query = { ls: { $exists: 1 } }
		options.sort = { ls: -1 }
		options.limit = 1

		return @find(query, options)?.fetch?()?[0]?.ls

	findByRoomIdAndUserIds: (roomId, userIds) ->
		query =
			rid: roomId
			'u._id':
				$in: userIds

		return @find query

	# UPDATE
	archiveByRoomId: (roomId) ->
		query =
			rid: roomId

		update =
			$set:
				alert: false
				open: false
				archived: true

		return @update query, update, { multi: true }

	unarchiveByRoomId: (roomId) ->
		query =
			rid: roomId

		update =
			$set:
				alert: false
				open: true
				archived: false

		return @update query, update, { multi: true }

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

	setAsUnreadByRoomIdAndUserId: (roomId, userId, firstMessageUnreadTimestamp) ->
		query =
			rid: roomId
			'u._id': userId

		update =
			$set:
				open: true
				alert: true
				ls: firstMessageUnreadTimestamp

		return @update query, update

	setFavoriteByRoomIdAndUserId: (roomId, userId, favorite=true) ->
		query =
			rid: roomId
			'u._id': userId

		update =
			$set:
				f: favorite

		return @update query, update

	updateNameAndAlertByRoomId: (roomId, name) ->
		query =
			rid: roomId

		update =
			$set:
				name: name
				alert: true

		return @update query, update, { multi: true }

	updateNameByRoomId: (roomId, name) ->
		query =
			rid: roomId

		update =
			$set:
				name: name

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

	setAlertForRoomIdExcludingUserId: (roomId, userId) ->
		query =
			rid: roomId
			'u._id':
				$ne: userId
			$or: [
				{ alert: { $ne: true } }
				{ open: { $ne: true } }
			]

		update =
			$set:
				alert: true
				open: true

		return @update query, update, { multi: true }

	setBlockedByRoomId: (rid, blocked, blocker) ->
		query =
			rid: rid
			'u._id': blocked

		update =
			$set:
				blocked: true

		query2 =
			rid: rid
			'u._id': blocker

		update2 =
			$set:
				blocker: true

		return @update(query, update) and @update(query2, update2)

	unsetBlockedByRoomId: (rid, blocked, blocker) ->
		query =
			rid: rid
			'u._id': blocked

		update =
			$unset:
				blocked: 1

		query2 =
			rid: rid
			'u._id': blocker

		update2 =
			$unset:
				blocker: 1

		return @update(query, update) and @update(query2, update2)

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

	setArchivedByUsername: (username, archived) ->
		query =
			t: 'd'
			name: username

		update =
			$set:
				archived: archived

		return @update query, update, { multi: true }

	updateLastActivityTimeByRoomId: (rid) ->
		query =
			rid: rid

		update =
			$set:
				la: new Date

		return @update query, update, { multi: true }

	# INSERT
	createWithRoomAndUser: (room, user, extraData) ->
		subscription =
			open: false
			alert: false
			unread: 0
			ts: room.ts
			la: new Date
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

RocketChat.models.Subscriptions = new ModelSubscriptions('subscription', true)
