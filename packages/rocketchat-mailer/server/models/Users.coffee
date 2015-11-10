# Extends model Users

RocketChat.models.Users.RocketMailUnsubscribe = (_id, createdAt) ->
	console.log '[RocketMailer.Unsubscribe]', _id, createdAt, new Date(parseInt createdAt)

	query =
		_id: _id
		createdAt: new Date(parseInt createdAt)

	update =
		$set:
			"rocketMailer.unsubscribed": true

	return @update query, update
