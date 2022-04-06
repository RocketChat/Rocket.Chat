import type { IUser, IPermission, IRoom } from '@rocket.chat/core-typings';

import { Authorization } from '../../../../server/sdk';

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
