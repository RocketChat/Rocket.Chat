import { Permissions } from '@rocket.chat/models';

import { guestPermissions } from '../lib/guestPermissions';

export const resetEnterprisePermissions = async function (): Promise<void> {
	await Permissions.update({ _id: { $nin: guestPermissions } }, { $pull: { roles: 'guest' } }, { multi: true });
};
