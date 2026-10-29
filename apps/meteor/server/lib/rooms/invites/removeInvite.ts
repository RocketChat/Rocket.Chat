import { ClientSafeError } from '@rocket.chat/core-services';
import type { IInvite } from '@rocket.chat/core-typings';
import { Invites } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../authorization/hasPermission';

export const removeInvite = async (userId: string, invite: Pick<IInvite, '_id'>) => {
	if (!userId || !invite) {
		return false;
	}

	if (!(await hasPermissionAsync(userId, 'create-invite-links'))) {
		throw new ClientSafeError('not_authorized');
	}

	if (!invite._id) {
		throw new ClientSafeError('error-the-field-is-required', 'The field _id is required', {
			method: 'removeInvite',
			field: '_id',
		});
	}

	const { deletedCount } = await Invites.removeById(invite._id);

	if (!deletedCount) {
		throw new ClientSafeError('invalid-invitation-id', 'Invalid Invitation _id', {
			method: 'removeInvite',
		});
	}

	return true;
};
