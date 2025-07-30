import type { IRole, IRoom } from '@rocket.chat/core-typings';
import type { ObjectId } from 'mongodb';
import { createContext } from 'react';

export type AuthorizationContextValue = {
	queryPermission(
		permission: string | ObjectId,
		scope?: string | ObjectId,
		scopedRoles?: IRole['_id'][],
	): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean];
	queryAtLeastOnePermission(
		permission: (string | ObjectId)[],
		scope?: string | ObjectId,
		scopedRoles?: IRole['_id'][],
	): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean];
	queryAllPermissions(
		permission: (string | ObjectId)[],
		scope?: string | ObjectId,
		scopedRoles?: IRole['_id'][],
	): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean];
	queryRole(
		role: string | ObjectId,
		scope?: IRoom['_id'],
	): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean];
	getRoles(): ReadonlyMap<IRole['_id'], IRole>;
	subscribeToRoles(callback: () => void): () => void;
};

const dummyRolesMap: ReadonlyMap<IRole['_id'], IRole> = new Map();

export const AuthorizationContext = createContext<AuthorizationContextValue>({
	queryPermission: () => [() => (): void => undefined, (): boolean => false],
	queryAtLeastOnePermission: () => [() => (): void => undefined, (): boolean => false],
	queryAllPermissions: () => [() => (): void => undefined, (): boolean => false],
	queryRole: () => [() => (): void => undefined, (): boolean => false],
	getRoles: (): ReadonlyMap<IRole['_id'], IRole> => dummyRolesMap,
	subscribeToRoles: (): (() => void) => (): void => undefined,
});
