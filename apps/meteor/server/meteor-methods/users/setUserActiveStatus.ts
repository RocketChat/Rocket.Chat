import { ClientSafeError } from '@rocket.chat/core-services';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { setUserActiveStatus } from '../../lib/users/setUserActiveStatus';

export const executeSetUserActiveStatus = async (
	fromUserId: string,
	userId: string,
	active: boolean,
	confirmRelinquish?: boolean,
): Promise<boolean> => {
	if (typeof active !== 'boolean') {
		throw new ClientSafeError('error-invalid-arguments', 'Invalid arguments', {
			method: 'setUserActiveStatus',
		});
	}

	if (!fromUserId || (await hasPermissionAsync(fromUserId, 'edit-other-user-active-status')) !== true) {
		throw new ClientSafeError('error-not-allowed', 'Not allowed', {
			method: 'setUserActiveStatus',
		});
	}

	await setUserActiveStatus(userId, active, confirmRelinquish, fromUserId);

	return true;
};
