RocketChat.models.Users = new class asd extends RocketChat.models._Base
	constructor: ->
		@model = Meteor.users


	# FIND
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

	findOneByEmailAddressAndVerified: (emailAddress, verified=true, options) ->
		query =
			emails:
				$elemMatch:
					address: emailAddress
					verified: verified

		return @findOne query, options

	findOneAdmin: (admin, options) ->
		query =
			admin: admin

		return @findOne query, options


	# UPDATE
	updateLastLoginById: (_id) ->
		return @update _id,
			$set:
				lastLogin: new Date
