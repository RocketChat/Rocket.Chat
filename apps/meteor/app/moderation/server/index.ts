import { Moderation } from '@rocket.chat/core-services';

import { settings } from '../../settings/server';
import { DEFAULT_TRUST_ROLES } from '../lib/permissions';
import { addRoleEditRestriction } from '../lib/addRoleEditRestriction';

settings.watch('Trust_Roles', async (value) => {
	if (value) {
		try {
			await Promise.all(
				DEFAULT_TRUST_ROLES.map(async (role) => {
					await Moderation.addPermissionsToRole(role._id, role.permission);
				}),
			);
		} catch (error) {
			console.error('An error occurred while adding permissions to roles:', error);
		}
		addRoleEditRestriction();
	}

	if (!value) {
		return;
	}

	try {
		await Moderation.resetUserRoles(DEFAULT_TRUST_ROLES.map((role) => role._id));
	} catch (error) {
		console.error('An error occurred while deleting trust roles:', error);
	}

	return value;
});
