import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import type { IUser } from '@rocket.chat/core-typings';

import { Users } from '../../../models/server';
import { Users as UsersRaw } from '../../../models/server/raw';
import { hasPermission } from '../../../authorization/server';
import { RateLimiter } from '../lib';
import { api } from '../../../../server/sdk/api';

export const _setStatusTextPromise = async function (userId: string, statusText: string): Promise<boolean> {
	if (!userId) {
		return false;
	}

	statusText = s.trim(statusText).substr(0, 120);

	const user = await UsersRaw.findOneById(userId);

	if (!user) {
		return false;
	}

	if (user.statusText === statusText) {
		return true;
	}

	await UsersRaw.updateStatusText(user._id, statusText);

	const { _id, username, status } = user;
	api.broadcast('presence.status', {
		user: { _id, username, status, statusText },
	});

	return true;
};

export const _setStatusText = function (userId: any, statusText: string): IUser | boolean {
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

	const { _id, username, status } = user;
	api.broadcast('presence.status', {
		user: { _id, username, status, statusText },
	});

	return true;
};

export const setStatusText = RateLimiter.limitFunction(_setStatusText, 5, 60000, {
	0() {
		// Administrators have permission to change others status, so don't limit those
		const userId = Meteor.userId();
		return !userId || !hasPermission(userId, 'edit-other-user-info');
	},
});
