import type { IRole } from '@rocket.chat/core-typings';
import type { ObjectId } from 'mongodb';

import { usePermission } from './usePermission';
import { usePermissionWithScopedRoles } from './usePermissionWithScopedRoles';

/**
 * A hook to check if user will have some permission after giving some other scoped roles along with user roles.
 *
 * @param permissions The permissions to check
 * @param scopedRoles The scoped roles to check to be included in the user roles
 * @returns If the user will have the permission
 */

export const usePermissionWithScopedAndUserRoles = (
	permission: string,
	scopedRoles: IRole['_id'][],
	scope?: string | ObjectId,
): boolean => {
	const scopedPermission = usePermissionWithScopedRoles(permission, scopedRoles);
	const userRolesPermission = usePermission(permission, scope);

	return scopedPermission || userRolesPermission;
};
