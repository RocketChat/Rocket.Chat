import { Permissions } from '@rocket.chat/models';

import { createOrUpdateProtectedRoleAsync } from '../../../../server/lib/roles/createOrUpdateProtectedRole';

export const createPermissions = async () => {
	const permissions = [
		{ _id: 'can-audit', roles: ['admin', 'auditor'] },
		{ _id: 'can-audit-log', roles: ['admin', 'auditor-log'] },
	];

	const defaultRoles = [
		{ name: 'auditor', scope: 'Users' },
		{ name: 'auditor-log', scope: 'Users' },
	] as const;

	for (const permission of permissions) {
		void Permissions.create(permission._id, permission.roles);
	}

	return Promise.all(defaultRoles.map((role) => createOrUpdateProtectedRoleAsync(role.name, role)));
};
