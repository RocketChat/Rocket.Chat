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

	setServiceId: (_id, serviceName, serviceId) ->
		update =
			$set: {}

		serviceIdKey = "services.#{serviceName}.id"
		update.$set[serviceIdKey] = serviceData.id

		return @update _id, update

	setUsername: (_id, username) ->
		update =
			$set: username: username

		return @update _id, update

	setName: (_id, name) ->
		update =
			$set:
				name: name

		return @update _id, update

	setAvatarOrigin: (_id, origin) ->
		update =
			$set:
				avatarOrigin: origin

		return @update _id, update

	unsetAvatarOrigin: (_id) ->
		update =
			$unset:
				avatarOrigin: 1

		return @update _id, update

	setUserActive: (_id, active=true) ->
		update =
			$set:
				active: active

		return @update _id, update

	setAllUsersActive: (active) ->
		update =
			$set:
				active: active

		return @update {}, update, { multi: true }

	unsetLoginTokens: (_id) ->
		update =
			$set:
				"services.resume.loginTokens" : []

		return @update _id, update

	setLanguage: (_id, language) ->
		update =
			$set:
				language: language

		return @update _id, update

	setProfile: (_id, profile) ->
		update =
			$set:
				"settings.profile": profile

		return @update _id, update

	setPreferences: (_id, preferences) ->
		update =
			$set:
				"settings.preferences": preferences

		return @update _id, update

	setUtcOffset: (_id, utcOffset) ->
		query =
			_id: _id
			utcOffset:
				$ne: utcOffset

		update =
			$set:
				utcOffset: utcOffset

		return @update query, update


	# INSERT
	create: (data) ->
		user =
			createdAt: new Date
			avatarOrigin: 'none'

		_.extend user, data

		return @insert user


	# REMOVE
	removeById: (_id) ->
		return @remove _id

	removeByUnverifiedEmail: (email) ->
		query =
			emails:
				$elemMatch:
					address: email
					verified: false

		return @remove query
