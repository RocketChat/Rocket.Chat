import { createContext, useContext, useMemo } from 'react';
import { useSubscription, Subscription, Unsubscribe } from 'use-subscription';

type SubscriptionQuery = {
	rid: string | Mongo.ObjectID;
} | {
	name: string;
}
type Fields = {
	[key: string]: boolean;
}

type Sort = {
	[key: string]: boolean;
}

type UserContextValue = {
	userId: string | null;
	user: Meteor.User | null;
	loginWithPassword: (user: string | object, password: string) => Promise<void>;
	queryPreference: <T>(key: string | Mongo.ObjectID, defaultValue?: T) => Subscription<T | undefined>;
	querySubscription: (query: SubscriptionQuery, fields: Fields, sort?: Sort) => Subscription <any | null>;
	querySubscriptions: (query: SubscriptionQuery, fields: Fields, sort?: Sort) => Subscription <any | null>;
};

export const UserContext = createContext<UserContextValue>({
	userId: null,
	user: null,
	loginWithPassword: async () => undefined,
	queryPreference: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	querySubscription: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	querySubscriptions: () => ({
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

export const useUserSubscription = <T>(rid: string | Mongo.ObjectID, fields: Fields): T | undefined => {
	const { querySubscription } = useContext(UserContext);
	const subscription = useMemo(() => querySubscription({ rid }, fields), [querySubscription, rid, fields]);
	return useSubscription(subscription);
};

export const useUserSubscriptions = <T>(query: SubscriptionQuery, fields: Fields, sort? : Sort): T | undefined => {
	const { querySubscriptions } = useContext(UserContext);
	const subscription = useMemo(() => querySubscriptions(query, fields, sort), [querySubscriptions, query, fields, sort]);
	return useSubscription(subscription);
};

export const useUserSubscriptionByName = <T>(name: string, fields: Fields, sort?: Sort): T | undefined => {
	const { querySubscription } = useContext(UserContext);
	const subscription = useMemo(() => querySubscription({ name }, fields, sort), [querySubscription, name, fields, sort]);
	return useSubscription(subscription);
};
