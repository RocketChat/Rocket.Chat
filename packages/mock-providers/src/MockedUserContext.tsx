import type { IUser } from '@rocket.chat/core-typings';
import { UserContext } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactNode } from 'react';

const johnDoe: IUser = {
	_id: 'john.doe',
	username: 'john.doe',
	name: 'John Doe',
	createdAt: new Date(),
	active: true,
	_updatedAt: new Date(),
	roles: ['admin'],
	type: 'user',
};

const userContextValue: ContextType<typeof UserContext> = {
	userId: 'john.doe',
	queryUser: () => [() => () => undefined, () => johnDoe],
	queryPreference: (<T,>(pref: string, defaultValue: T) => [
		() => () => undefined,
		() => (typeof pref === 'string' ? undefined : defaultValue),
	]) as any,
	querySubscriptions: () => [() => () => undefined, () => []],
	querySubscription: () => [() => () => undefined, () => undefined],
	queryRoom: () => [() => () => undefined, () => undefined],

	logout: () => Promise.resolve(),
	onLogout: () => () => undefined,
};

const createUserContextValue = ({ userPreferences }: { userPreferences?: Record<string, unknown> }): ContextType<typeof UserContext> => {
	return {
		...userContextValue,
		...(userPreferences && { queryPreference: (id) => [() => () => undefined, () => userPreferences[id as unknown as string] as any] }),
	};
};

export type MockedUserContextProps = { children: ReactNode; userPreferences?: Record<string, unknown> };

export const MockedUserContext = ({ userPreferences, children }: MockedUserContextProps) => {
	return <UserContext.Provider value={createUserContextValue({ userPreferences })}>{children}</UserContext.Provider>;
};
