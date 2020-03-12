import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { Users } from '../../../models';
import { Notifications } from '../../../notifications';
import { hasPermission } from '../../../authorization';
import { RateLimiter } from '../lib';

// mirror of object in /imports/startup/client/listenActiveUsers.js - keep updated
const STATUS_MAP = {
	offline: 0,
	online: 1,
	away: 2,
	busy: 3,
};

export const _setStatusText = function(userId, statusText) {
	statusText = s.trim(statusText);
	if (statusText.length > 120) {
		statusText = statusText.substr(0, 120);
	}

	if (!userId) {
		return false;
	}

	const user = Users.findOneById(userId);

	// User already has desired statusText, return
	if (user.statusText === statusText) {
		return user;
	}

	// Set new statusText
	Users.updateStatusText(user._id, statusText);
	user.statusText = statusText;

	Notifications.notifyLogged('user-status', [
		user._id,
		user.username,
		STATUS_MAP[user.status],
		statusText,
	]);

	return true;
};

export const setStatusText = RateLimiter.limitFunction(_setStatusText, 5, 60000, {
	0() {
		// Administrators have permission to change others status, so don't limit those
		return !Meteor.userId() || !hasPermission(Meteor.userId(), 'edit-other-user-info');
	},
});
