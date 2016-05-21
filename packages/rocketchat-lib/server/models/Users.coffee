RocketChat.models.Users = new class extends RocketChat.models._Base
	constructor: ->
		@model = Meteor.users

		@tryEnsureIndex { 'roles': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'name': 1 }
		@tryEnsureIndex { 'lastLogin': 1 }
		@tryEnsureIndex { 'status': 1 }
		@tryEnsureIndex { 'active': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'statusConnection': 1 }, { sparse: 1 }
		@tryEnsureIndex { 'type': 1 }


	# FIND ONE
	findOneById: (_id, options) ->
		return @findOne _id, options

	findOneByUsername: (username, options) ->
		query =
			username: username

		return @findOne query, options

	findOneByEmailAddress: (emailAddress, options) ->
		query =
			'emails.address': emailAddress

		return @findOne query, options

	findOneVerifiedFromSameDomain: (email, options) ->
		domain = s.strRight(email, '@')
		query =
			emails:
				$elemMatch:
					address:
						$regex: new RegExp "@" + domain + "$", "i"
						$ne: email
					verified: true

		return @findOne query, options

	findOneAdmin: (admin, options) ->
		query =
			admin: admin

		return @findOne query, options

	findOneByIdAndLoginToken: (_id, token, options) ->
		query =
			_id: _id
			'services.resume.loginTokens.hashedToken' : Accounts._hashLoginToken(token)

		return @findOne query, options


	# FIND
	findById: (userId) ->
		query =
			_id: userId

		return @find query

	findUsersNotOffline: (options) ->
		query =
			username:
				$exists: 1
			status:
				$in: ['online', 'away', 'busy']

		return @find query, options


	findByUsername: (username, options) ->
		query =
			username: username

		return @find query, options

	findUsersByUsernamesWithHighlights: (usernames, options) ->
		query =
			username: { $in: usernames }
			'settings.preferences.highlights':
				$exists: true

		return @find query, options

	findActiveByUsernameOrNameRegexWithExceptions: (searchTerm, exceptions = [], options = {}) ->
		if not _.isArray exceptions
			exceptions = [ exceptions ]

		termRegex = new RegExp searchTerm, "i"
		query =
			$and: [
				{ active: true }
				{'$or': [
					{'$and': [
						{ username: { $nin: exceptions } }
						{ username: termRegex }
					]}
					{'$and': [
						{ name: { $nin: exceptions } }
						{ name: termRegex }
					]}
				]}
			]
			type:
				$in: ['user', 'bot']

		return @find query, options

	findByActiveUsersUsernameExcept: (username, except, options) ->
		query =
			active: true
			$and: [
				{username: {$nin: except}}
				{username: username}
			]

		return @find query, options

	findUsersByNameOrUsername: (nameOrUsername, options) ->
		query =
			username:
				$exists: 1

			$or: [
				{name: nameOrUsername}
				{username: nameOrUsername}
			]

			type:
				$in: ['user']

		return @find query, options

	findByUsernameNameOrEmailAddress: (usernameNameOrEmailAddress, options) ->
		query =
			$or: [
				{name: usernameNameOrEmailAddress}
				{username: usernameNameOrEmailAddress}
				{'emails.address': usernameNameOrEmailAddress}
			]
			type:
				$in: ['user', 'bot']

		return @find query, options

	findLDAPUsers: (options) ->
		query =
			ldap: true

		return @find query, options

	getLastLogin: (options = {}) ->
		query = { lastLogin: { $exists: 1 } }
		options.sort = { lastLogin: -1 }
		options.limit = 1

		return @find(query, options)?.fetch?()?[0]?.lastLogin

	findUsersByUsernames: (usernames, options) ->
		query =
			username:
				$in: usernames

		return @find query, options

	# UPDATE
	updateLastLoginById: (_id) ->
		update =
			$set:
				lastLogin: new Date

		return @update _id, update

	setServiceId: (_id, serviceName, serviceId) ->
		update =
			$set: {}

		serviceIdKey = "services.#{serviceName}.id"
		update.$set[serviceIdKey] = serviceId

		return @update _id, update

	setUsername: (_id, username) ->
		update =
			$set: username: username

		return @update _id, update

	setEmail: (_id, email) ->
		update =
			$set:
				emails: [
					address: email
					verified: false
				]

		return @update _id, update

	setEmailVerified: (_id, email) ->
		query =
			_id: _id
			emails:
				$elemMatch:
					address: email
					verified: false

		update =
			$set:
				'emails.$.verified': true

		return @update query, update

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

	unsetRequirePasswordChange: (_id) ->
		update =
			$unset:
				"requirePasswordChange" : true
				"requirePasswordChangeReason" : true

		return @update _id, update

	resetPasswordAndSetRequirePasswordChange: (_id, requirePasswordChange, requirePasswordChangeReason) ->
		update =
			$unset:
				"services.password": 1
			$set:
				"requirePasswordChange" : requirePasswordChange,
				"requirePasswordChangeReason": requirePasswordChangeReason

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

	saveUserById: (_id, data) ->
		setData = {}
		unsetData = {}

		if data.name?
			if not _.isEmpty(s.trim(data.name))
				setData.name = s.trim(data.name)
			else
				unsetData.name = 1

		if data.email?
			if not _.isEmpty(s.trim(data.email))
				setData.emails = [
					address: s.trim(data.email)
				]
			else
				unsetData.name = 1

		if data.phone?
			if not _.isEmpty(s.trim(data.phone))
				setData.phone = [
					phoneNumber: s.trim(data.phone)
				]
			else
				unsetData.phone = 1

		update = {}

		if not _.isEmpty setData
			update.$set = setData

		if not _.isEmpty unsetData
			update.$unset = unsetData

		return @update { _id: _id }, update

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

	###
	Find users to send a message by email if:
	- he is not online
	- has a verified email
	- has not disabled email notifications
	###
	getUsersToSendOfflineEmail: (usersIds) ->
		query =
			_id:
				$in: usersIds
			status: 'offline'
			statusConnection:
				$ne: 'online'
			'emails.verified': true

		return @find query, { fields: { name: 1, username: 1, emails: 1, 'settings.preferences.emailNotificationMode': 1 } }

