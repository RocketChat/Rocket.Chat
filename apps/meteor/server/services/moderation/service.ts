import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IModerationService } from '@rocket.chat/core-services';
import { Permissions, Roles, Users } from '@rocket.chat/models';
import type { IRole } from '@rocket.chat/core-typings';

import { createOrUpdateProtectedRoleAsync } from '../../lib/roles/createOrUpdateProtectedRole';

export class ModerationService extends ServiceClassInternal implements IModerationService {
	protected name = 'moderation';

	async resetUserRoles(roles: string[]): Promise<void> {
		const usersInRole = await Users.findUsersInRoles(roles, undefined, { projection: { _id: 1 } }).toArray();

		const usersToRemove = usersInRole.map((user) => user._id);

		// remove the roles from the users

		for await (const roleId of roles) {
			const role = await Roles.findOneById<Pick<IRole, '_id'>>(roleId, { projection: { _id: 1 } });

			if (!role) {
				continue;
			}

			await Users.removeRolesByUserIds(usersToRemove, [roleId]);
		}

		// remove the roles
		const rolePromises = roles.map(async (roleName) => {
			const role = await Roles.findOneById(roleName);
			if (role) {
				await Roles.removeById(role._id);
			}
		});
		await Promise.all(rolePromises);
	}

	async addPermissionsToRole(roleName: string, permissions: string[]): Promise<void> {
		try {
			// create the role if it doesn't exist
			await createOrUpdateProtectedRoleAsync(roleName, {
				name: roleName,
				scope: 'Users',
				description: roleName,
				mandatory2fa: false,
			});

			// add the permissions to the role
			await Permissions.updateMany({ _id: { $in: permissions }, roles: { $ne: roleName } }, { $addToSet: { roles: roleName } });
		} catch (error) {
			console.error(`Error adding permissions to role ${roleName}: ${error}`);
		}
	}
}
