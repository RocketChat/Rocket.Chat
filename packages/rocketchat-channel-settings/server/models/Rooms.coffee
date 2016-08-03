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
		users = @findOne(query, { fields: { usernames: 1 }})?.usernames
	else
		update.$set.muted = []

	return @update query, update

RocketChat.models.Rooms.setSystemMessagesById = (_id, systemMessages) ->
	query =
		_id: _id

	update =
		$set:
			sysMes: systemMessages

	return @update query, update
