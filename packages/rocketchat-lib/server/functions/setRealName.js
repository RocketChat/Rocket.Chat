RocketChat._setRealName = function(userId, name) {
	name = s.trim(name);
	if (!userId || !name) {
		return false;
	}

	const user = RocketChat.models.Users.findOneById(userId);

	// User already has desired name, return
	if (user.name === name) {
		return user;
	}

	const previousName = user.name;

	if (previousName) {
		RocketChat.models.Messages.updateAllNamesByUserId(user._id, name);
		RocketChat.models.Subscriptions.setRealNameForDirectRoomsWithUsername(user.username, name);
	}

	// Set new name
	RocketChat.models.Users.setName(user._id, name);
	user.name = name;
	return user;
};

RocketChat.setRealName = RocketChat.RateLimiter.limitFunction(RocketChat._setRealName, 1, 60000, {
	0() { return !Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'edit-other-user-info'); } // Administrators have permission to change others names, so don't limit those
});
