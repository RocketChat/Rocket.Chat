import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { deleteUser } from '../../lib/users/deleteUser';

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
