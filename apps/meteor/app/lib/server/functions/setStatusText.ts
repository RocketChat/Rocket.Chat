import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { hasPermission } from '../../../authorization/server';
import { RateLimiter } from '../lib';
import { api } from '../../../../server/sdk/api';

async function _setStatusTextPromise(userId: string, statusText: string): Promise<boolean> {
	if (!userId) {
		return false;
	}

	statusText = s.trim(statusText).substr(0, 120);

	const user = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'statusText'>>(userId, {
		projection: { username: 1, name: 1, status: 1, roles: 1, statusText: 1 },
	});

	if (!user) {
		return false;
	}

	if (user.statusText === statusText) {
		return true;
	}

	await Users.updateStatusText(user._id, statusText);

	const { _id, username, status, name, roles } = user;
	api.broadcast('presence.status', {
		user: { _id, username, status, statusText, name, roles },
		previousStatus: status,
	});

	return true;
}

function _setStatusText(userId: any, statusText: string): boolean {
	return Promise.await(_setStatusTextPromise(userId, statusText));
}

export const setStatusText = RateLimiter.limitFunction(_setStatusText, 5, 60000, {
	0() {
		// Administrators have permission to change others status, so don't limit those
		const userId = Meteor.userId();
		return !userId || !hasPermission(userId, 'edit-other-user-info');
	},
});
