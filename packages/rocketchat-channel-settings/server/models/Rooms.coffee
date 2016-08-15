RocketChat.models.Rooms.setDescriptionById = (_id, description) ->
	query =
		_id: _id

	update =
		$set:
			description: description

	return @update query, update

RocketChat.models.Rooms.setReadOnlyById = (_id, readOnly) ->
	query =
		_id: _id

	update =
		$set:
			ro: readOnly

	update.$set.muted = []

	if readOnly
		# we want to mute all users without the post-read-only permission

		# get all usernames for this room
		users = @findOne(query, { fields: { usernames: 1 }})

		users.usernames.forEach (userName) ->

			# lookup the user
			user = RocketChat.models.Users.findOneByUsername userName

			if user != null and RocketChat.authz.hasPermission(user._id, 'post-read-only') is false
				update.$set.muted.push userName

	return @update query, update

RocketChat.models.Rooms.setSystemMessagesById = (_id, systemMessages) ->
	query =
		_id: _id

	update =
		$set:
			sysMes: systemMessages

	return @update query, update
