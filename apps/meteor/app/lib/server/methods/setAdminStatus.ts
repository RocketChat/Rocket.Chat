import { isUserFederated } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { addUserToRole } from '../../../authorization/server/methods/addUserToRole';
import { removeUserFromRole } from '../../../authorization/server/methods/removeUserFromRole';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setAdminStatus(userId: string, admin?: boolean): void;
	}
}

Meteor.methods<ServerMethods>({
	async setAdminStatus(userId, admin) {
		check(userId, String);
		check(admin, Match.Optional(Boolean));

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setAdminStatus' });
		}

		if ((await hasPermissionAsync(uid, 'assign-admin-role')) !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setAdminStatus' });
		}

		const user = await Users.findOne({ _id: userId }, { projection: { username: 1, federated: 1 } });
		if (!user || isUserFederated(user)) {
			throw new Meteor.Error('error-not-allowed', 'Federated Users cant be admins', { method: 'setAdminStatus' });
		}

		if (admin) {
			await addUserToRole(uid, 'admin', user?.username);
			return;
		}

		await removeUserFromRole(uid, 'admin', user?.username);
	},
});
