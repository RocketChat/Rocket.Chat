import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { deleteUser } from '../../app/lib/server/functions/deleteUser';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteUser(userId: IUser['_id'], confirmRelinquish?: boolean): boolean;
	}
}

export const executeDeleteUser = async (fromUserId: IUser['_id'], userId: IUser['_id'], confirmRelinquish = false): Promise<boolean> => {
	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user to delete', {
			method: 'deleteUser',
		});
	}

	if (user.type === 'app') {
		throw new Meteor.Error('error-cannot-delete-app-user', 'Deleting app user is not allowed', {
			method: 'deleteUser',
		});
	}

	const adminCount = await Users.countDocuments({ roles: 'admin' });

	const userIsAdmin = user.roles?.indexOf('admin') > -1;

	if (adminCount === 1 && userIsAdmin) {
		throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
			method: 'deleteUser',
			action: 'Remove_last_admin',
		});
	}

	await deleteUser(userId, confirmRelinquish, fromUserId);

	return true;
};

Meteor.methods<ServerMethods>({
	async deleteUser(userId, confirmRelinquish = false) {
		check(userId, String);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteUser',
			});
		}

		if ((await hasPermissionAsync(uid, 'delete-user')) !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteUser',
			});
		}

		return executeDeleteUser(uid, userId, confirmRelinquish);
	},
});
