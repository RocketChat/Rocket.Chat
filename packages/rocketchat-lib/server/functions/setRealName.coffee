RocketChat._setRealName = (userId, name) ->
	if not userId or not name
		return false

	user = RocketChat.models.Users.findOneById userId

	# User already has desired name, return
	if user.name is name
		return user

	# Set new name
	RocketChat.models.Users.setName user._id, name
	user.name = name

	RocketChat.models.Subscriptions.setAliasForDirectRoomsWithName user.username, name

	return user

RocketChat.setRealName = RocketChat.RateLimiter.limitFunction RocketChat._setRealName, 1, 60000,
	0: (userId) -> return not userId or not RocketChat.authz.hasPermission(userId, 'edit-other-user-info') # Administrators have permission to change others names, so don't limit those
