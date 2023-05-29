import { Permissions, Roles } from '@rocket.chat/models';

import { settings } from '../../settings/server';
import { createOrUpdateProtectedRoleAsync } from '../../../server/lib/roles/createOrUpdateProtectedRole';
import { explorer, novice } from '../lib/permissions';
import { addRoleEditRestriction } from '../lib/addRoleEditRestriction';

const addPermissionsToRole = async (roleName: string, permissions: string[]) => {
	try {
		await createOrUpdateProtectedRoleAsync(roleName, {
			name: roleName,
			scope: 'Users',
			description: roleName,
			mandatory2fa: false,
		});

		const promises = permissions.map((permission) => Permissions.addRole(permission, roleName));
		await Promise.all(promises);
	} catch (error) {
		console.error(`Error adding permissions to role ${roleName}: ${error}`);
	}
};

Meteor.startup(async () => {
	settings.watch('Trust_Roles', async (value) => {
		if (value === true) {
			await addPermissionsToRole('novice', novice);
			await addPermissionsToRole('explorer', explorer);
			await addRoleEditRestriction();
		}

		if (value === false) {
			const rolesToRemove = ['novice', 'explorer'];
			const rolePromises = rolesToRemove.map(async (roleName) => {
				const role = await Roles.findOneById(roleName);
				if (role) {
					await Roles.removeById(role._id);
				}
			});
			await Promise.all(rolePromises);
		}

		return value;
	});
});
