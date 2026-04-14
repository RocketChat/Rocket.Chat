import { Permissions } from '@rocket.chat/models';

export const createPermissions = async () => {
	const permissions = [{ _id: 'abac-management', roles: ['admin'] }];

	for (const permission of permissions) {
		void Permissions.create(permission._id, permission.roles);
	}
};
