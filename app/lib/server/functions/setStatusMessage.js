import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { Users } from '../../../models';
import { Notifications } from '../../../notifications';
import { hasPermission } from '../../../authorization';
import { RateLimiter } from '../lib';

export const _setStatusMessage = function(userId, statusMessage) {
	statusMessage = s.trim(statusMessage);
	if (statusMessage.length > 120) {
		statusMessage = statusMessage.substr(0, 120);
	}

	if (!userId) {
		return false;
	}

	const user = Users.findOneById(userId);

	// User already has desired statusMessage, return
	if (user.statusText === statusMessage) {
		return user;
	}

	// Set new statusMessage
	Users.updateStatusText(user._id, statusMessage);
	user.statusText = statusMessage;

	Notifications.notifyLogged('Users:StatusMessageChanged', {
		_id: user._id,
		name: user.name,
		username: user.username,
		statusText: user.statusText,
	});

	return true;
};

export const setStatusMessage = RateLimiter.limitFunction(_setStatusMessage, 1, 60000, {
	0() {
		// Administrators have permission to change others status, so don't limit those
		return !Meteor.userId() || !hasPermission(Meteor.userId(), 'edit-other-user-info');
	},
});
