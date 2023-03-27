import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IUser } from '@rocket.chat/core-typings';

import { Users } from '../../app/models/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { callbacks } from '../../lib/callbacks';
import { deleteUser } from '../../app/lib/server';
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

		const user = Users.findOneById(userId);
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

		const adminCount = Meteor.users.find({ roles: 'admin' }).count();

		const userIsAdmin = user.roles?.indexOf('admin') > -1;

		if (adminCount === 1 && userIsAdmin) {
			throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
				method: 'deleteUser',
				action: 'Remove_last_admin',
			});
		}

		await deleteUser(userId, confirmRelinquish);

		callbacks.run('afterDeleteUser', user);

		// App IPostUserDeleted event hook
		await Apps.triggerEvent(AppEvents.IPostUserDeleted, { user, performedBy: Meteor.user() });

		return true;
	},
});
