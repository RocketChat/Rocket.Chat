import { Apps, AppEvents } from '@rocket.chat/apps';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { SHA256 } from '@rocket.chat/sha256';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { trim } from '../../../../lib/utils/stringUtils';
import { settings } from '../../../settings/server';
import { deleteUser } from '../functions/deleteUser';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteUserOwnAccount(password: string, confirmRelinquish?: boolean): Promise<boolean>;
	}
}

export const deleteUserOwnAccount = async (fromUserId: string, password: string, confirmRelinquish = false): Promise<boolean> => {
	if (!settings.get('Accounts_AllowDeleteOwnAccount')) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'deleteUserOwnAccount',
		});
	}

	if (!fromUserId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'deleteUserOwnAccount',
		});
	}

	const user = await Users.findOneById(fromUserId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'deleteUserOwnAccount',
		});
	}

	if (user.services?.password && trim(user.services.password.bcrypt)) {
		const result = await Accounts._checkPasswordAsync(user as Meteor.User, {
			digest: password.toLowerCase(),
			algorithm: 'sha-256',
		});
		if (result.error) {
			throw new Meteor.Error('error-invalid-password', 'Invalid password', {
				method: 'deleteUserOwnAccount',
			});
		}
	} else if (!user.username || SHA256(user.username) !== password.trim()) {
		throw new Meteor.Error('error-invalid-username', 'Invalid username', {
			method: 'deleteUserOwnAccount',
		});
	}

	await deleteUser(fromUserId, confirmRelinquish);

	// App IPostUserDeleted event hook
	await Apps.self?.triggerEvent(AppEvents.IPostUserDeleted, { user });

	return true;
};

Meteor.methods<ServerMethods>({
	async deleteUserOwnAccount(password, confirmRelinquish) {
		check(password, String);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteUserOwnAccount',
			});
		}

		return deleteUserOwnAccount(uid, password, confirmRelinquish);
	},
});
