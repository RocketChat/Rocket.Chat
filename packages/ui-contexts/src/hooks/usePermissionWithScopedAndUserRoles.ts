import type { IRole } from '@rocket.chat/core-typings';
import type { ObjectId } from 'mongodb';

import { usePermission } from './usePermission';
import { usePermissionWithScopedRoles } from './usePermissionWithScopedRoles';

export const usePermissionWithScopedAndUserRoles = (
	permission: string,
	scopedRoles: IRole['_id'][],
	scope?: string | ObjectId,
): boolean => {
	const scopedPermission = usePermissionWithScopedRoles(permission, scopedRoles);
	const userRolesPermission = usePermission(permission, scope);

	return scopedPermission || userRolesPermission;
};
