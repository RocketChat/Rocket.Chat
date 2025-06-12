import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Users } from '../../../models';
import { Users as UsersRaw } from '../../../models/server/raw';
import { Notifications } from '../../../notifications';
import { RateLimiter } from '../lib';

// mirror of object in /imports/startup/client/listenActiveUsers.js - keep updated
const STATUS_MAP = {
	offline: 0,
	online: 1,
	away: 2,
	busy: 3,
};

export const _setStatusTextPromise = async function(userId, statusText) {
	if (!userId) { return false; }

	statusText = s.trim(statusText).substr(0, 120);

	const user = await UsersRaw.findOneById(userId);

	if (!user) { return false; }

	if (user.statusText === statusText) { return true; }

	await UsersRaw.updateStatusText(user._id, statusText);

	Notifications.notifyLogged('user-status', {
		_id: user._id,
		username: user.username,
		status: STATUS_MAP[user.status],
		statusText,
	});

	return true;
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

	Notifications.notifyLogged('user-status', {
		_id: user._id,
		username: user.username,
		status: STATUS_MAP[user.status],
		statusText,
	});

	return true;
};

export const setStatusText = RateLimiter.limitFunction(_setStatusText, 5, 60000, {
	0() {
		// Administrators have permission to change others status, so don't limit those
		return !Meteor.userId() || !hasPermission(Meteor.userId(), 'edit-other-user-info');
	},
});
