import type { IPermission } from '@rocket.chat/core-typings';
import { Permissions } from '@rocket.chat/models';

export const createPermissions = async () => {
	const permissions: { _id: IPermission['_id']; roles: string[] }[] = [{ _id: 'abac-management', roles: ['admin'] }];

	for (const permission of permissions) {
		void Permissions.create(permission._id, permission.roles);
	}
};
