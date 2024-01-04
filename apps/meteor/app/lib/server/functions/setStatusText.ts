import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RateLimiter } from '../lib';

async function _setStatusTextPromise(userId: string, statusText: string): Promise<boolean> {
	if (!userId) {
		return false;
	}

	statusText = statusText.trim().substr(0, 120);

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
	void api.broadcast('presence.status', {
		user: { _id, username, status, statusText, name, roles },
		previousStatus: status,
	});

	return true;
}

export const setStatusText = RateLimiter.limitFunction(
	async function _setStatusText(userId: any, statusText: string) {
		return _setStatusTextPromise(userId, statusText);
	},
	5,
	60000,
	{
		async 0() {
			// Administrators have permission to change others status, so don't limit those
			const userId = Meteor.userId();
			return !userId || !(await hasPermissionAsync(userId, 'edit-other-user-info'));
		},
	},
);
