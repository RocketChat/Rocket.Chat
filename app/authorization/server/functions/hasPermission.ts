import { Authorization } from '../../../../server/sdk';
import type { IUser } from '../../../../definition/IUser';
import type { IPermission } from '../../../../definition/IPermission';
import type { IRoom } from '../../../../definition/IRoom';

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

export const hasAllPermission = (...args: Parameters<typeof hasAllPermissionAsync>): boolean =>
	Promise.await(hasAllPermissionAsync(...args));
export const hasPermission = (...args: Parameters<typeof hasPermissionAsync>): boolean => Promise.await(hasPermissionAsync(...args));
export const hasAtLeastOnePermission = (...args: Parameters<typeof hasAtLeastOnePermissionAsync>): boolean =>
	Promise.await(hasAtLeastOnePermissionAsync(...args));
