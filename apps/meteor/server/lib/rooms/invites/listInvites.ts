import { ClientSafeError } from '@rocket.chat/core-services';
import { Invites } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../authorization/hasPermission';

export const listInvites = async (userId: string) => {
	if (!userId) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user', { method: 'listInvites' });
	}

	if (!(await hasPermissionAsync(userId, 'create-invite-links'))) {
		throw new ClientSafeError('not_authorized');
	}

	return Invites.find({}).toArray();
};
