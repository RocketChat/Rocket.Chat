import { createContext, useContext, useMemo } from 'react';
import { useSubscription, Subscription, Unsubscribe } from 'use-subscription';

type UserContextValue = {
	userId: string | null;
	user: Meteor.User | null;
	loginWithPassword: (user: string | object, password: string) => Promise<void>;
	queryPreference: <T>(key: string | Mongo.ObjectID, defaultValue?: T) => Subscription<T | undefined>;
};

export const UserContext = createContext<UserContextValue>({
	userId: null,
	user: null,
	loginWithPassword: async () => undefined,
	queryPreference: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
});

export const useUserId = (): string | Mongo.ObjectID | null =>
	useContext(UserContext).userId;

export const useUser = (): Meteor.User | null =>
	useContext(UserContext).user;

export const useLoginWithPassword = (): ((user: string | object, password: string) => Promise<void>) =>
	useContext(UserContext).loginWithPassword;

export const useUserPreference = <T>(key: string | Mongo.ObjectID, defaultValue?: T): T | undefined => {
	const { queryPreference } = useContext(UserContext);
	const subscription = useMemo(() => queryPreference(key, defaultValue), [queryPreference, key, defaultValue]);
	return useSubscription(subscription);
};
