RocketChat.models.Messages = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'message'

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

	# FIND
	findByMention: (username, options) ->
		query =
			"mentions.username": username

		return @find query, options

	findVisibleByRoomId: (roomId, options) ->
		query =
			_hidden:
				$ne: true
			rid: roomId

		return @find query, options

	findInvisibleByRoomId: (roomId, options) ->
		query =
			_hidden: true
			rid: roomId

		return @find query, options

	findVisibleByRoomIdAfterTimestamp: (roomId, timestamp, options) ->
		query =
			_hidden:
				$ne: true
			rid: roomId
			ts:
				$gt: timestamp

		return @find query, options

	findVisibleByRoomIdBeforeTimestamp: (roomId, timestamp, options) ->
		query =
			_hidden:
				$ne: true
			rid: roomId
			ts:
				$lt: timestamp

		return @find query, options

	findVisibleByRoomIdBetweenTimestamps: (roomId, afterTimestamp, beforeTimestamp, options) ->
		query =
			_hidden:
				$ne: true
			rid: roomId
			ts:
				$gt: afterTimestamp
				$lt: beforeTimestamp

		return @find query, options

	findVisibleCreatedOrEditedAfterTimestamp: (timestamp, options) ->
		query =
			_hidden: { $ne: true }
			$or: [
				ts:
					$gt: timestamp
			,
				ets:
					$gt: timestamp
			]

		return @find query, options

	findStarredByUserAtRoom: (userId, roomId, options) ->
		query =
			_hidden: { $ne: true }
			'starred._id': userId
			rid: roomId

		console.log 'findStarredByUserAtRoom', arguments

		return @find query, options

	cloneAndSaveAsHistoryById: (_id) ->
		record = @findOneById _id
		record._hidden = true
		record.parent = record._id
		record.ets = new Date()
		delete record._id

		return @insert record


	# UPDATE
	setHiddenById: (_id, hidden=true) ->
		query =
			_id: _id

		update =
			$set:
				_hidden: hidden

		return @update query, update

	setAsDeletedById: (_id) ->
		query =
			_id: _id

		update =
			$set:
				msg: ''
				t: 'rm'
				ets: new Date()

		return @update query, update

	setPinnedByIdAndUserId: (_id, userId, pinned=true) ->
		query =
			_id: _id
			'u._id': userId

		update =
			$set:
				pinned: pinned
				pts: new Date

		return @update query, update

	setUrlsById: (_id, urls) ->
		query =
			_id: _id

		update =
			$set:
				urls: urls

		return @update query, update

	updateAllUsernamesByUserId: (userId, username) ->
		query =
			'u._id': userId

		update =
			$set:
				"u.username": username

		return @update query, update, { multi: true }

	updateUsernameAndMessageOfMentionByIdAndOldUsername: (_id, oldUsername, newUsername, newMessage) ->
		query =
			_id: _id
			"mentions.username": oldUsername

		update =
			$set:
				"mentions.$.username": newUsername
				"msg": newMessage

		return @update query, update

	updateUserStarById: (_id, userId, starred) ->
		query =
			_id: _id

		if starred
			update =
				$addToSet:
					starred: { _id: userId }
		else
			update =
				$pull:
					starred: { _id: Meteor.userId() }

		return @update query, update

	# INSERT
	createWithTypeRoomIdMessageAndUser: (type, roomId, message, user, extraData) ->
		record =
			t: type
			rid: roomId
			ts: new Date
			msg: message
			u:
				_id: user._id
				username: user.username

		_.extend record, extraData

		record._id = @insert record
		return record

	createUserJoinWithRoomIdAndUser: (roomId, user, extraData) ->
		message = user.username
		return @createWithTypeRoomIdMessageAndUser 'uj', roomId, message, user, extraData

	createUserLeaveWithRoomIdAndUser: (roomId, user, extraData) ->
		message = user.username
		return @createWithTypeRoomIdMessageAndUser 'ul', roomId, message, user, extraData

	createUserRemovedWithRoomIdAndUser: (roomId, user, extraData) ->
		message = user.username
		return @createWithTypeRoomIdMessageAndUser 'ru', roomId, message, user, extraData

	createUserAddedWithRoomIdAndUser: (roomId, user, extraData) ->
		message = user.username
		return @createWithTypeRoomIdMessageAndUser 'au', roomId, message, user, extraData

	createRoomRenamedWithRoomIdRoomNameAndUser: (roomId, roomName, user, extraData) ->
		return @createWithTypeRoomIdMessageAndUser 'r', roomId, roomName, user, extraData


	# REMOVE
	removeById: (_id) ->
		query =
			_id: _id

		return @remove query

	removeByRoomId: (roomId) ->
		query =
			rid: roomId

		return @remove query

	removeByUserId: (userId) ->
		query =
			"u._id": userId

		return @remove query
