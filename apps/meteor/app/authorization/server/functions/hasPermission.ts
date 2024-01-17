import { Authorization } from '@rocket.chat/core-services';
import type { IUser, IPermission, IRoom } from '@rocket.chat/core-typings';

export const hasAllPermissionAsync = async (
	userId: IUser['_id'],
	permissions: IPermission['_id'][],
	scope?: IRoom['_id'],
): Promise<boolean> => Authorization.hasAllPermission(userId, permissions, scope);
export const hasPermissionAsync = async (userId: IUser['_id'], permissionId: IPermission['_id'], scope?: IRoom['_id']): Promise<boolean> =>
	Authorization.hasPermission(userId, permissionId, scope);
export const hasAtLeastOnePermissionAsync = async (
	userId: IUser['_id'],
	permissions: IPermission['_id'][],
	scope?: IRoom['_id'],
): Promise<boolean> => Authorization.hasAtLeastOnePermission(userId, permissions, scope);
