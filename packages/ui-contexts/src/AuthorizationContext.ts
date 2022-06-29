import type { IRole } from '@rocket.chat/core-typings';
import type { IEmitter } from '@rocket.chat/emitter';
import { createContext } from 'react';
import type { ObjectId } from 'mongodb';

export type IRoles = { [_id: string]: IRole };

export type RoleStore = IEmitter<{
	change: IRoles;
}> & {
	roles: IRoles;
};

export type AuthorizationContextValue = {
	queryPermission(
		permission: string | ObjectId,
		scope?: string | ObjectId,
	): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean];
	queryAtLeastOnePermission(
		permission: (string | ObjectId)[],
		scope?: string | ObjectId,
	): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean];
	queryAllPermissions(
		permission: (string | ObjectId)[],
		scope?: string | ObjectId,
	): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean];
	queryRole(role: string | ObjectId): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean];
	roleStore: RoleStore;
};

export const AuthorizationContext = createContext<AuthorizationContextValue>({
	queryPermission: () => [() => (): void => undefined, (): boolean => false],
	queryAtLeastOnePermission: () => [() => (): void => undefined, (): boolean => false],
	queryAllPermissions: () => [() => (): void => undefined, (): boolean => false],
	queryRole: () => [() => (): void => undefined, (): boolean => false],
	roleStore: {
		roles: {},
		emit: (): void => undefined,
		on: () => (): void => undefined,
		off: (): void => undefined,
		events: (): 'change'[] => ['change'],
		has: (): boolean => false,
		once: () => (): void => undefined,
	},
});
