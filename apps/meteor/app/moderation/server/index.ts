import { Permissions, Roles, Users } from '@rocket.chat/models';

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

Meteor.startup(() => {
	settings.watch('Trust_Roles', async (value) => {
		if (value === true) {
			await addPermissionsToRole('novice', novice);
			await addPermissionsToRole('explorer', explorer);
			addRoleEditRestriction();
		}

		if (value === false) {
			try {
				const rolesToRemove = ['novice', 'explorer'];

				// get the users in the above roles
				const usersInRole = await Users.findUsersInRoles(rolesToRemove, undefined, { projection: { _id: 1 } }).toArray();

				const usersToRemove = usersInRole.map((user) => user._id);

				// remove the roles from the users
				await Roles.removeUsersRoles(usersToRemove, rolesToRemove);

				// add the default 'user' role to the users
				await Roles.addRolesByUserIds(usersToRemove, 'user');

				// remove the roles
				const rolePromises = rolesToRemove.map(async (roleName) => {
					const role = await Roles.findOneById(roleName);
					if (role) {
						await Roles.removeById(role._id);
					}
				});
				await Promise.all(rolePromises);
			} catch (error) {
				console.error('An error occurred, while deleting trust roles:', error);
			}
		}

		return value;
	});
});
