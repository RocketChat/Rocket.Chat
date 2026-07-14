import { Authorization } from '@rocket.chat/core-services';
import type { IUser, IPermission, IRoom } from '@rocket.chat/core-typings';

export const hasAllPermissionAsync = async (
	user: IUser['_id'] | IUser,
	permissions: IPermission['_id'][],
	scope?: IRoom['_id'],
): Promise<boolean> => Authorization.hasAllPermission(user, permissions, scope);
export const hasPermissionAsync = async (
	user: IUser['_id'] | IUser,
	permissionId: IPermission['_id'],
	scope?: IRoom['_id'],
): Promise<boolean> => Authorization.hasPermission(user, permissionId, scope);
export const hasAtLeastOnePermissionAsync = async (
	user: IUser['_id'] | IUser,
	permissions: IPermission['_id'][],
	scope?: IRoom['_id'],
): Promise<boolean> => Authorization.hasAtLeastOnePermission(user, permissions, scope);
