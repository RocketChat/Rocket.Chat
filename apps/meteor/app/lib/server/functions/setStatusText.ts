import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { ClientSession } from 'mongodb';

import { onceTransactionCommitedSuccessfully } from '../../../../server/database/utils';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RateLimiter } from '../lib';

async function _setStatusText(userId: string, statusText: string, updater?: Updater<IUser>, session?: ClientSession): Promise<boolean> {
	if (!userId) {
		return false;
	}

	statusText = statusText.trim().substr(0, 120);

	const user = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'statusText'>>(userId, {
		projection: { username: 1, name: 1, status: 1, roles: 1, statusText: 1 },
		session,
	});

	if (!user) {
		return false;
	}

	if (user.statusText === statusText) {
		return true;
	}

	if (updater) {
		updater.set('statusText', statusText);
	} else {
		await Users.updateStatusText(user._id, statusText, { session });
	}

	const { _id, username, status, name, roles } = user;
	await onceTransactionCommitedSuccessfully(() => {
		void api.broadcast('presence.status', {
			user: { _id, username, status, statusText, name, roles },
			previousStatus: status,
		});
	}, session);

	return true;
}

export const setStatusText = RateLimiter.limitFunction(_setStatusText, 5, 60000, {
	async 0() {
		// Administrators have permission to change others status, so don't limit those
		const userId = Meteor.userId();
		return !userId || !(await hasPermissionAsync(userId, 'edit-other-user-info'));
	},
});
