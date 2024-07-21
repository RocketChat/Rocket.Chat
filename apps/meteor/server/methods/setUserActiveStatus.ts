import { License, Federation, FederationEE } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { MatrixBridgedUser, Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
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

		const { federated } = (await Users.findOneById<Pick<IUser, 'federated'>>(uid, { projection: { federated: 1 } })) || {};

		if (federated) {
			throw new Meteor.Error('error-not-allowed', 'Deactivating federated user is not allowed', { method: 'setUserActiveStatus' });
		}

		const remoteUser = await MatrixBridgedUser.getExternalUserIdByLocalUserId(userId);

		if (remoteUser) {
			if (active) {
				throw new Meteor.Error('error-not-allowed', 'Deactivated federated users can not be re-activated', {
					method: 'setUserActiveStatus',
				});
			}

			const federation = (await License.hasValidLicense()) ? FederationEE : Federation;

			await federation.deactivateRemoteUser(remoteUser);
		}

		await setUserActiveStatus(userId, active, confirmRelinquish);

		return true;
	},
});
