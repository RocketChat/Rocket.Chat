import { Permissions } from '@rocket.chat/models';

export const createPermissions = async () => {
	const permissions = [
		{ _id: 'abac-management', roles: ['admin'] },
		{ _id: 'manage-abac-admin-settings', roles: ['admin'] },
		{ _id: 'manage-abac-admin-room-attributes', roles: ['admin'] },
		{ _id: 'manage-abac-admin-rooms', roles: ['admin'] },
		{ _id: 'view-abac-admin-audit', roles: ['admin'] },
	];

	for (const permission of permissions) {
		void Permissions.create(permission._id, permission.roles);
	}
};
