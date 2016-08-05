RocketChat._setRealName = (userId, name) ->
	name = s.trim name
	if not userId or not name
		return false

	user = RocketChat.models.Users.findOneById userId

	# User already has desired name, return
	if user.name is name
		return user

	previousName = user.name

	if previousName
		RocketChat.models.Messages.updateAllNamesByUserId user._id, name
		RocketChat.models.Subscriptions.setRealNameForDirectRoomsWithUsername user.username, name

	# Set new name
	RocketChat.models.Users.setName user._id, name
	user.name = name
	return user

RocketChat.setRealName = RocketChat.RateLimiter.limitFunction RocketChat._setRealName, 1, 60000,
	0: () -> return not Meteor.userId() or not RocketChat.authz.hasPermission(Meteor.userId(), 'edit-other-user-info') # Administrators have permission to change others names, so don't limit those
