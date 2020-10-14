import { createContext, useContext, useMemo } from 'react';
import { useSubscription, Subscription, Unsubscribe } from 'use-subscription';

export type AuthorizationContextValue = {
	queryPermission(
		permission: string | Mongo.ObjectID,
		scope?: string | Mongo.ObjectID
	): Subscription<boolean>;
	queryAtLeastOnePermission(
		permission: (string | Mongo.ObjectID)[],
		scope?: string | Mongo.ObjectID
	): Subscription<boolean>;
	queryAllPermissions(
		permission: (string | Mongo.ObjectID)[],
		scope?: string | Mongo.ObjectID
	): Subscription<boolean>;
	queryRole(role: string | Mongo.ObjectID): Subscription<boolean>;
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
});

export const usePermission = (
	permission: string | Mongo.ObjectID,
	scope?: string | Mongo.ObjectID,
): boolean => {
	const { queryPermission } = useContext(AuthorizationContext);
	const subscription = useMemo(
		() => queryPermission(permission, scope),
		[queryPermission, permission, scope],
	);
	return useSubscription(subscription);
};

export const useAtLeastOnePermission = (
	permissions: (string | Mongo.ObjectID)[],
	scope?: string | Mongo.ObjectID,
): boolean => {
	const { queryAtLeastOnePermission } = useContext(AuthorizationContext);
	const subscription = useMemo(
		() => queryAtLeastOnePermission(permissions, scope),
		[queryAtLeastOnePermission, permissions, scope],
	);
	return useSubscription(subscription);
};

export const useAllPermissions = (
	permissions: (string | Mongo.ObjectID)[],
	scope?: string | Mongo.ObjectID,
): boolean => {
	const { queryAllPermissions } = useContext(AuthorizationContext);
	const subscription = useMemo(
		() => queryAllPermissions(permissions, scope),
		[queryAllPermissions, permissions, scope],
	);
	return useSubscription(subscription);
};

export const useRole = (role: string | Mongo.ObjectID): boolean => {
	const { queryRole } = useContext(AuthorizationContext);
	const subscription = useMemo(() => queryRole(role), [queryRole, role]);
	return useSubscription(subscription);
};
