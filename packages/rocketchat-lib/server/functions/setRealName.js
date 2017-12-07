import s from 'underscore.string';

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

	// Set new name
	RocketChat.models.Users.setName(user._id, name);
	user.name = name;

	if (RocketChat.settings.get('UI_Use_Real_Name') === true) {
		RocketChat.Notifications.notifyLogged('Users:NameChanged', {
			_id: user._id,
			name: user.name,
			username: user.username
		});
	}

	return user;
};

RocketChat.setRealName = RocketChat.RateLimiter.limitFunction(RocketChat._setRealName, 1, 60000, {
	0() { return !Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'edit-other-user-info'); } // Administrators have permission to change others names, so don't limit those
});
