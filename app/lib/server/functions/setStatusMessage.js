import { Meteor } from 'meteor/meteor';
import { Users, Subscriptions } from '../../../models';
import { Notifications } from '../../../notifications';
import { hasPermission } from '../../../authorization';
import { RateLimiter } from '../lib';
import s from 'underscore.string';

export const _setStatusMessage = function(userId, statusMessage) {
	statusMessage = s.trim(statusMessage);

	if (!userId) {
		return false;
	}

	if (statusMessage.length > 120) {
		throw new Meteor.Error('error-status-message-too-long', 'Status message too long.');
	}

	const user = Users.findOneById(userId);

	// User already has desired statusMessage, return
	if (user.statusMessage === statusMessage) {
		return user;
	}

	// Set new statusMessage
	Users.setStatusMessage(user._id, statusMessage);
	user.statusMessage = statusMessage;

	Subscriptions.updateUserStatusMessage(user._id, statusMessage);

	Notifications.notifyLogged('Users:StatusMessageChanged', {
		_id: user._id,
		name: user.name,
		username: user.username,
		statusMessage: user.statusMessage,
	});

	return true;
};

export const setStatusMessage = RateLimiter.limitFunction(_setStatusMessage, 1, 60000, {
	0() { return !Meteor.userId() || !hasPermission(Meteor.userId(), 'edit-other-user-info'); }, // Administrators have permission to change others status, so don't limit those
});
