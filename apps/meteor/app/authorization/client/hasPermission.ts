import type { IUser, IRole, IPermission } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

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
	(permissionIds: IPermission['_id'][], scope: string | undefined, userId: IUser['_id'], scopedRoles?: IPermission['_id'][]): boolean => {
		const user = Models.Users.findOneById(userId, { fields: { roles: 1 } });

		const checkEachPermission = quantifier.bind(permissionIds);

		return checkEachPermission((permissionId) => {
			if (user?.roles) {
				if (AuthorizationUtils.isPermissionRestrictedForRoleList(permissionId, user.roles)) {
					return false;
				}
			}

			const permission = Models.Permissions.findOne(permissionId, {
				fields: { roles: 1 },
			});
			const roles = permission?.roles ?? [];

			return roles.some((roleId) => {
				const role = Models.Roles.findOne(roleId, { fields: { scope: 1 } });
				const roleScope = role?.scope;

				if (!isValidScope(roleScope)) {
					return false;
				}

				const model = Models[roleScope];

				if (scopedRoles?.includes(roleId)) {
					return true;
				}

				if (hasIsUserInRole(model)) {
					return model.isUserInRole(userId, roleId, scope);
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

	if (!Models.AuthzCachedCollection.ready.get()) {
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
