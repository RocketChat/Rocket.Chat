import type { IUser, IRole, IPermission } from '@rocket.chat/core-typings';

import * as Models from '../../models/client';
import { AuthorizationUtils } from '../lib/AuthorizationUtils';

const isValidScope = (scope: unknown): scope is keyof typeof Models => typeof scope === 'string' && scope in Models;

const hasIsUserInRole = (
	model: unknown,
): model is {
	isUserInRole: (this: any, uid: IUser['_id'], roleId: IRole['_id'], scope: string | undefined) => boolean;
} => typeof model === 'object' && model !== null && typeof (model as { isUserInRole?: unknown }).isUserInRole === 'function';

const createPermissionValidator =
	(quantifier: (predicate: (permissionId: IPermission['_id']) => boolean) => boolean) =>
	(permissionIds: IPermission['_id'][], scope: string | undefined, user: IUser, scopedRoles?: IPermission['_id'][]): boolean => {
		const checkEachPermission = quantifier.bind(permissionIds);

		return checkEachPermission((permissionId) => {
			if (user?.roles) {
				if (AuthorizationUtils.isPermissionRestrictedForRoleList(permissionId, user.roles)) {
					return false;
				}
			}

			const permission = Models.Permissions.state.get(permissionId);
			const roles = permission?.roles ?? [];

			return roles.some((roleId) => {
				const roleScope = Models.Roles.state.get(roleId)?.scope;

				if (!isValidScope(roleScope)) {
					return false;
				}

				const model = Models[roleScope];

				if (scopedRoles?.includes(roleId)) {
					return true;
				}

				if (hasIsUserInRole(model)) {
					return model.isUserInRole(user._id, roleId, scope);
				}

				return undefined;
			});
		});
	};

const atLeastOne = createPermissionValidator(Array.prototype.some);

const all = createPermissionValidator(Array.prototype.every);

const validatePermissions = (
	permissions: IPermission['_id'] | IPermission['_id'][],
	scope: string | undefined,
	predicate: (permissionIds: IPermission['_id'][], scope: string | undefined, user: IUser, scopedRoles?: IPermission['_id'][]) => boolean,
	user: IUser | null,
	scopedRoles?: IPermission['_id'][],
): boolean => {
	if (!user) {
		return false;
	}

	if (!Models.AuthzCachedCollection.ready.get()) {
		return false;
	}

	return predicate(([] as IPermission['_id'][]).concat(permissions), scope, user, scopedRoles);
};

export const hasAllPermission = (
	user: Meteor.User | IUser | null,
	permissions: IPermission['_id'] | IPermission['_id'][],
	scope?: string,
	scopedRoles?: IPermission['_id'][],
): boolean => validatePermissions(permissions, scope, all, user as IUser, scopedRoles);

export const hasAtLeastOnePermission = (
	user: Meteor.User | IUser | null,
	permissions: IPermission['_id'] | IPermission['_id'][],
	scope?: string,
): boolean => validatePermissions(permissions, scope, atLeastOne, user as IUser);

export const userHasAllPermission = (user: IUser | null, permissions: IPermission['_id'] | IPermission['_id'][], scope?: string): boolean =>
	validatePermissions(permissions, scope, all, user);

export const hasPermission = hasAllPermission;
