RocketChat.models.Messages = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'message'

		@tryEnsureIndex { 'rid': 1, 'ts': 1 }
		@tryEnsureIndex { 'ts': 1 }
		@tryEnsureIndex { 'editedAt': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'editedBy._id': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'rid': 1, 't': 1, 'u._id': 1 }
		@tryEnsureIndex { 'expireAt': 1 }, { expireAfterSeconds: 0 }
		@tryEnsureIndex { 'msg': 'text' }
		@tryEnsureIndex { 'file._id': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'mentions.username': 1 }, { sparse: 1 }


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

	findVisibleByMentionAndRoomId: (username, rid, options) ->
		query =
			_hidden: { $ne: true }
			"mentions.username": username
			"rid": rid

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
				'editedAt':
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

	findPinnedByRoom: (roomId, options) ->
		query =
			t: { $ne: 'rm' }
			_hidden: { $ne: true }
			pinned: true
			rid: roomId

		return @find query, options

	getLastTimestamp: (options = {}) ->
		query = { ts: { $exists: 1 } }
		options.sort = { ts: -1 }
		options.limit = 1

		return @find(query, options)?.fetch?()?[0]?.ts

	findByRoomIdAndMessageIds: (rid, messageIds, options) ->
		query =
			rid: rid
			_id:
				$in: messageIds

		return @find query, options

	cloneAndSaveAsHistoryById: (_id) ->
		me = RocketChat.models.Users.findOneById Meteor.userId()
		record = @findOneById _id
		record._hidden = true
		record.parent = record._id
		record.editedAt = new Date
		record.editedBy =
			_id: Meteor.userId()
			username: me.username
		record.pinned = record.pinned
		record.pinnedAt = record.pinnedAt
		record.pinnedBy =
			_id: record.pinnedBy?._id
			username: record.pinnedBy?.username
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
		me = RocketChat.models.Users.findOneById Meteor.userId()
		query =
			_id: _id

		update =
			$set:
				msg: ''
				t: 'rm'
				urls: []
				mentions: []
				attachments: []
				editedAt: new Date()
				editedBy:
					_id: Meteor.userId()
					username: me.username

		return @update query, update

	setPinnedByIdAndUserId: (_id, pinnedBy, pinned=true) ->
		query =
			_id: _id

		update =
			$set:
				pinned: pinned
				pinnedAt: new Date
				pinnedBy: pinnedBy

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

	updateUsernameOfEditByUserId: (userId, username) ->
		query =
			'editedBy._id': userId

		update =
			$set:
				"editedBy.username": username

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

	upgradeEtsToEditAt: ->
		query =
			ets: { $exists: 1 }

		update =
			$rename:
				"ets": "editedAt"

		return @update query, update, { multi: true }

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
			groupable: false

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

	createCommandWithRoomIdAndUser: (command, roomId, user, extraData) ->
		return @createWithTypeRoomIdMessageAndUser 'command', roomId, command, user, extraData

	createUserMutedWithRoomIdAndUser: (roomId, user, extraData) ->
		message = user.username
		return @createWithTypeRoomIdMessageAndUser 'user-muted', roomId, message, user, extraData

	createUserUnmutedWithRoomIdAndUser: (roomId, user, extraData) ->
		message = user.username
		return @createWithTypeRoomIdMessageAndUser 'user-unmuted', roomId, message, user, extraData

	createNewModeratorWithRoomIdAndUser: (roomId, user, extraData) ->
		message = user.username
		return @createWithTypeRoomIdMessageAndUser 'new-moderator', roomId, message, user, extraData

	createModeratorRemovedWithRoomIdAndUser: (roomId, user, extraData) ->
		message = user.username
		return @createWithTypeRoomIdMessageAndUser 'moderator-removed', roomId, message, user, extraData

	createNewOwnerWithRoomIdAndUser: (roomId, user, extraData) ->
		message = user.username
		return @createWithTypeRoomIdMessageAndUser 'new-owner', roomId, message, user, extraData

	createOwnerRemovedWithRoomIdAndUser: (roomId, user, extraData) ->
		message = user.username
		return @createWithTypeRoomIdMessageAndUser 'owner-removed', roomId, message, user, extraData

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

	getMessageByFileId: (fileID) ->
		return @findOne { 'file._id': fileID }
