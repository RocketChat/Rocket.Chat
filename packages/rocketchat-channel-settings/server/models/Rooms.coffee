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

	if readOnly
		# we want to mute all users without the post-readonly permission

		usernames = @findOne(query, { fields: { usernames: 1 }})
		users = RocketChat.models.Users.findUsersByUsernames usernames?.usernames, {fields: {username: 1}}
		users.forEach (user) ->
			if RocketChat.authz.hasPermission(user._id, 'post-readonly') is false
				# create a new array if necessary
				update.$set.muted = [] if !update.$set.muted
				update.$set.muted.push user.username
	else
		# remove the muted user array
		update.$unset = {muted: ""}

	return @update query, update

RocketChat.models.Rooms.setSystemMessagesById = (_id, systemMessages) ->
	query =
		_id: _id

	update =
		$set:
			sysMes: systemMessages

	return @update query, update
