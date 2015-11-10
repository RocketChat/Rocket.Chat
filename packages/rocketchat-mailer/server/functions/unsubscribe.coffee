RocketMailer.unsubscribe = (hash) ->
	[_id, createdAt] = hash.split ':'
	if _id and createdAt
		return RocketChat.models.Users.RocketMailUnsubscribe(_id, createdAt) == 1
	return false
