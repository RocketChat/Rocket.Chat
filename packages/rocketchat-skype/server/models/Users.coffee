RocketChat.models.Users.setSkypeLogin = (_id, skypeLogin) ->
	query =
		_id: _id

	update =
		$set:
			skypeLogin: skypeLogin

	return @update query, update

