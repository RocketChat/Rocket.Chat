import { Apps, AppEvents } from '@rocket.chat/apps';
import { ClientSafeError } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import { SHA256 } from '@rocket.chat/sha256';

import { trim } from '../../../lib/utils/stringUtils';
import { compareUserPassword } from '../../lib/compareUserPassword';
import { deleteUser } from '../../lib/users/deleteUser';
import { settings } from '../../settings';

export const deleteUserOwnAccount = async (fromUserId: string, password: string, confirmRelinquish = false): Promise<boolean> => {
	if (!settings.get('Accounts_AllowDeleteOwnAccount')) {
		throw new ClientSafeError('error-not-allowed', 'Not allowed', {
			method: 'deleteUserOwnAccount',
		});
	}

	if (!fromUserId) {
		throw new ClientSafeError('error-unauthenticated', 'Unauthenticated', {
			method: 'deleteUserOwnAccount',
		});
	}

	const user = await Users.findOneById(fromUserId);
	if (!user) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user', {
			method: 'deleteUserOwnAccount',
		});
	}

	if (user.services?.password && trim(user.services.password.bcrypt)) {
		if (!(await compareUserPassword(user, { sha256: password }))) {
			throw new ClientSafeError('error-invalid-password', 'Invalid password', {
				method: 'deleteUserOwnAccount',
			});
		}
	} else if (!user.username || SHA256(user.username) !== password.trim()) {
		throw new ClientSafeError('error-invalid-username', 'Invalid username', {
			method: 'deleteUserOwnAccount',
		});
	}

	await deleteUser(fromUserId, confirmRelinquish);

	// App IPostUserDeleted event hook
	await Apps.self?.triggerEvent(AppEvents.IPostUserDeleted, { user });

	return true;
};
