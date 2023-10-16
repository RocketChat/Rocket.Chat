import type { LoginService } from '@rocket.chat/ui-contexts';
import { UserContext } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { ContextType } from 'react';

const userContextValue: ContextType<typeof UserContext> = {
	userId: 'john.doe',
	user: {
		_id: 'john.doe',
		username: 'john.doe',
		name: 'John Doe',
		createdAt: new Date(),
		active: true,
		_updatedAt: new Date(),
		roles: ['admin'],
		type: 'user',
	},
	queryPreference: (<T,>(pref: string, defaultValue: T) => [
		() => () => undefined,
		() => (typeof pref === 'string' ? undefined : defaultValue),
	]) as any,
	querySubscriptions: () => [() => () => undefined, () => []],
	querySubscription: () => [() => () => undefined, () => undefined],
	queryRoom: () => [() => () => undefined, () => undefined],

	queryAllServices: () => [() => (): void => undefined, (): LoginService[] => []],
	loginWithService: () => () => Promise.reject('loginWithService not implemented'),
	loginWithPassword: async () => Promise.reject('loginWithPassword not implemented'),
	loginWithToken: async () => Promise.reject('loginWithToken not implemented'),
	logout: () => Promise.resolve(),
};

const createUserContextValue = ({ userPreferences }: { userPreferences?: Record<string, unknown> }): ContextType<typeof UserContext> => {
	return {
		...userContextValue,
		...(userPreferences && { queryPreference: (id) => [() => () => undefined, () => userPreferences[id as unknown as string] as any] }),
	};
};

export const MockedUserContext = ({
	userPreferences,
	children,
}: {
	children: React.ReactNode;
	userPreferences?: Record<string, unknown>;
}) => {
	return <UserContext.Provider value={createUserContextValue({ userPreferences })}>{children}</UserContext.Provider>;
};
