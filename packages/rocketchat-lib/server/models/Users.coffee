RocketChat.models.Users = new class asd extends RocketChat.models._Base
	constructor: ->
		@model = Meteor.users


	# FIND ONE
	findOneById: (_id, options) ->
		return @findOne _id, options

	findOneByUsername: (username, options) ->
		query =
			username: username

		return @findOne query, options

	findOneByEmailAddress: (emailAddress, options) ->
		query =
			'email.address': emailAddress

		return @findOne query, options

	findOneByVerifiedEmailAddress: (emailAddress, options) ->
		query =
			emails:
				$elemMatch:
					address: emailAddress
					verified: true

		return @findOne query, options

	findOneAdmin: (admin, options) ->
		query =
			admin: admin

		return @findOne query, options


	# FIND
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

	findUsersByNameOrUsername: (nameOrUsername, options) ->
		query =
			username:
				$exists: 1

			$or: [
				{name: nameOrUsername}
				{username: nameOrUsername}
			]

		return @find query, options

	findByUsernameNameOrEmailAddress: (usernameNameOrEmailAddress, options) ->
		query =
			$or: [
				{name: usernameNameOrEmailAddress}
				{username: usernameNameOrEmailAddress}
				{'emails.address': usernameNameOrEmailAddress}
			]

		return @find query, options


	# UPDATE
	updateLastLoginById: (_id) ->
		update =
			$set:
				lastLogin: new Date

		return @update _id, update
