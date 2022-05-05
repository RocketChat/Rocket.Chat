import type { IRole } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { createContext } from 'react';
import type { Subscription, Unsubscribe } from 'use-subscription';
import type { ObjectId } from 'mongodb';

export type IRoles = { [_id: string]: IRole };

export class RoleStore extends Emitter<{
	change: IRoles;
}> {
	roles: IRoles = {};
}

export type AuthorizationContextValue = {
	queryPermission(permission: string | ObjectId, scope?: string | ObjectId): Subscription<boolean>;
	queryAtLeastOnePermission(permission: (string | ObjectId)[], scope?: string | ObjectId): Subscription<boolean>;
	queryAllPermissions(permission: (string | ObjectId)[], scope?: string | ObjectId): Subscription<boolean>;
	queryRole(role: string | ObjectId): Subscription<boolean>;
	roleStore: RoleStore;
};

export const AuthorizationContext = createContext<AuthorizationContextValue>({
	queryPermission: () => ({
		getCurrentValue: (): boolean => false,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	queryAtLeastOnePermission: () => ({
		getCurrentValue: (): boolean => false,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	queryAllPermissions: () => ({
		getCurrentValue: (): boolean => false,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	queryRole: () => ({
		getCurrentValue: (): boolean => false,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	roleStore: new RoleStore(),
});
