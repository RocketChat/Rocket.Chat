# Extends model Users

RocketChat.models.Users.RocketMailUnsubscribe = (_id, createdAt) ->

	query =
		_id: _id
		createdAt: new Date(parseInt createdAt)

	update =
		$set:
			"mailer.unsubscribed": true

	affectedRows = @update query, update

	console.log '[Mailer:Unsubscribe]', _id, createdAt, new Date(parseInt createdAt), affectedRows

	return affectedRows
