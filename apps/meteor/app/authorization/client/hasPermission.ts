import type { IUser, IPermission } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { hasRole } from './hasRole';
import { watch } from './watch';
import { AuthzCachedCollection, Permissions, Users } from '../../models/client';
import { AuthorizationUtils } from '../lib/AuthorizationUtils';

const createPermissionValidator =
	(quantifier: (predicate: (permissionId: IPermission['_id']) => boolean) => boolean) =>
	(permissionIds: IPermission['_id'][], scope: string | undefined, userId: IUser['_id'], scopedRoles?: IPermission['_id'][]): boolean => {
		const userRoles = watch(Users.use, (state) => state.get(userId)?.roles);

		const checkEachPermission = quantifier.bind(permissionIds);

		return checkEachPermission((permissionId) => {
			if (userRoles) {
				if (AuthorizationUtils.isPermissionRestrictedForRoleList(permissionId, userRoles)) {
					return false;
				}
			}

			const permission = watch(Permissions.use, (state) => state.get(permissionId));
			const roles = permission?.roles ?? [];

			return roles.some((roleId) => {
				if (scopedRoles?.includes(roleId)) {
					return true;
				}

				return hasRole(userId, roleId, scope);
			});
		});
	};

const atLeastOne = createPermissionValidator(Array.prototype.some);

const all = createPermissionValidator(Array.prototype.every);

const validatePermissions = (
	permissions: IPermission['_id'] | IPermission['_id'][],
	scope: string | undefined,
	predicate: (
		permissionIds: IPermission['_id'][],
		scope: string | undefined,
		userId: IUser['_id'],
		scopedRoles?: IPermission['_id'][],
	) => boolean,
	userId?: IUser['_id'] | null,
	scopedRoles?: IPermission['_id'][],
): boolean => {
	userId = userId ?? Meteor.userId();

	if (!userId) {
		return false;
	}

	if (!AuthzCachedCollection.ready.get()) {
		return false;
	}

	return predicate(([] as IPermission['_id'][]).concat(permissions), scope, userId, scopedRoles);
};

export const hasAllPermission = (
	permissions: IPermission['_id'] | IPermission['_id'][],
	scope?: string,
	scopedRoles?: IPermission['_id'][],
): boolean => validatePermissions(permissions, scope, all, undefined, scopedRoles);

export const hasAtLeastOnePermission = (permissions: IPermission['_id'] | IPermission['_id'][], scope?: string): boolean =>
	validatePermissions(permissions, scope, atLeastOne);

export const userHasAllPermission = (
	permissions: IPermission['_id'] | IPermission['_id'][],
	scope?: string,
	userId?: IUser['_id'] | null,
): boolean => validatePermissions(permissions, scope, all, userId);

export const hasPermission = hasAllPermission;
