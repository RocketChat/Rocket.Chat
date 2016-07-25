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
			ro: readOnly is true

	if readOnly is true
		users = @findOne(query, { fields: { usernames: 1 }})?.usernames
		if users
			update.$set.muted = users
	else
		update.$set.muted = []

	return @update query, update
