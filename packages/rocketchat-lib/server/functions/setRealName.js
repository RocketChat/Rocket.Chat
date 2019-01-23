import { Meteor } from 'meteor/meteor';
import { Users, Subscriptions } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';
import { Notifications } from 'meteor/rocketchat:notifications';
import { hasPermission } from 'meteor/rocketchat:authorization';
import s from 'underscore.string';

const _setRealName = function(userId, name) {
	name = s.trim(name);
	if (!userId || !name) {
		return false;
	}

	const user = Users.findOneById(userId);

	// User already has desired name, return
	if (user.name === name) {
		return user;
	}

	// Set new name
	Users.setName(user._id, name);
	user.name = name;

	Subscriptions.updateDirectFNameByName(user.username, name);

	if (settings.get('UI_Use_Real_Name') === true) {
		Notifications.notifyLogged('Users:NameChanged', {
			_id: user._id,
			name: user.name,
			username: user.username,
		});
	}

	return user;
};

export const setRealName = RocketChat.RateLimiter.limitFunction(_setRealName, 1, 60000, {
	0() { return !Meteor.userId() || !hasPermission(Meteor.userId(), 'edit-other-user-info'); }, // Administrators have permission to change others names, so don't limit those
});

RocketChat.setRealName = setRealName;
RocketChat._setRealName = _setRealName;
