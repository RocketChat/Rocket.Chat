import { Authorization } from '@rocket.chat/core-services';
import type { UserWithRoles } from '@rocket.chat/core-services';
import type { IUser, IPermission, IRoom } from '@rocket.chat/core-typings';

// Forward only the fields the permission check needs, so a full user document
// (with services, e2e keys, etc.) isn't serialized to the authorization service.
const toSubject = (user: IUser['_id'] | UserWithRoles): IUser['_id'] | UserWithRoles =>
	typeof user === 'string' ? user : { _id: user._id, roles: user.roles };

export const hasAllPermissionAsync = async (
	user: IUser['_id'] | UserWithRoles,
	permissions: IPermission['_id'][],
	scope?: IRoom['_id'],
): Promise<boolean> => Authorization.hasAllPermission(toSubject(user), permissions, scope);
export const hasPermissionAsync = async (
	user: IUser['_id'] | UserWithRoles,
	permissionId: IPermission['_id'],
	scope?: IRoom['_id'],
): Promise<boolean> => Authorization.hasPermission(toSubject(user), permissionId, scope);
export const hasAtLeastOnePermissionAsync = async (
	user: IUser['_id'] | UserWithRoles,
	permissions: IPermission['_id'][],
	scope?: IRoom['_id'],
): Promise<boolean> => Authorization.hasAtLeastOnePermission(toSubject(user), permissions, scope);
