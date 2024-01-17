import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { deleteUser } from '../../app/lib/server/functions/deleteUser';
import { AppEvents, Apps } from '../../ee/server/apps/orchestrator';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteUser(userId: IUser['_id'], confirmRelinquish?: boolean): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async deleteUser(userId, confirmRelinquish = false) {
		check(userId, String);
		const uid = Meteor.userId();
		if (!uid || (await hasPermissionAsync(uid, 'delete-user')) !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteUser',
			});
		}

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

		const adminCount = await Users.col.countDocuments({ roles: 'admin' });

		const userIsAdmin = user.roles?.indexOf('admin') > -1;

		if (adminCount === 1 && userIsAdmin) {
			throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
				method: 'deleteUser',
				action: 'Remove_last_admin',
			});
		}

		await deleteUser(userId, confirmRelinquish, uid);

		// App IPostUserDeleted event hook
		await Apps.triggerEvent(AppEvents.IPostUserDeleted, { user, performedBy: await Meteor.userAsync() });

		return true;
	},
});
