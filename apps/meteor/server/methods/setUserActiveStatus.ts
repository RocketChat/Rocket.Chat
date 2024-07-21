import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { MatrixBridgedUser, Users } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { setUserActiveStatus } from '../../app/lib/server/functions/setUserActiveStatus';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setUserActiveStatus(userId: string, active: boolean, confirmRelinquish?: boolean): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async setUserActiveStatus(userId, active, confirmRelinquish) {
		check(userId, String);
		check(active, Boolean);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserActiveStatus',
			});
		}


		if (!uid || (await hasPermissionAsync(uid, 'edit-other-user-active-status')) !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserActiveStatus',
			});
		}

		const { federated } = await Users.findOneById<Pick<IUser, 'federated'>>(uid, { projection: { federated: 1 } }) || {};

		if (federated) {
			throw new Meteor.Error('error-not-allowed', 'Deactivating federated user is not allowed',
				{ method: 'deleteUser' },
			);
		}

		const remoteUser = await MatrixBridgedUser.getExternalUserIdByLocalUserId(uid);

		if (remoteUser) {
			throw new Meteor.Error('error-not-allowed', 'User is participating in federation, deactivation is not allowed',
				{ method: 'deleteUser' },
			);
		}

		await setUserActiveStatus(userId, active, confirmRelinquish);

		return true;
	},
});
