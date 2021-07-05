import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { FilterQuery } from 'mongodb';
import { createContext, useContext, useMemo } from 'react';
import { useSubscription, Subscription, Unsubscribe } from 'use-subscription';

import { IRoom } from '../../definition/IRoom';
import { ISubscription } from '../../definition/ISubscription';
import { useRoute } from './RouterContext';

type SubscriptionQuery =
	| {
			rid: string | Mongo.ObjectID;
	  }
	| {
			name: string;
	  }
	| {
			open: boolean;
	  }
	| object;

type Fields = {
	[key: string]: boolean;
};

type Sort = {
	[key: string]: -1 | 1 | number;
};

type FindOptions = {
	fields?: Fields;
	sort?: Sort;
};

type UserContextValue = {
	userId: string | null;
	user: Meteor.User | null;
	loginWithPassword: (user: string | object, password: string) => Promise<void>;
	logout: () => Promise<void>;
	queryPreference: <T>(
		key: string | Mongo.ObjectID,
		defaultValue?: T,
	) => Subscription<T | undefined>;
	querySubscription: (
		query: FilterQuery<ISubscription>,
		fields: Fields,
		sort?: Sort,
	) => Subscription<ISubscription | undefined>;
	queryRoom: (
		query: FilterQuery<IRoom>,
		fields?: Fields,
		sort?: Sort,
	) => Subscription<IRoom | undefined>;
	querySubscriptions: (
		query: SubscriptionQuery,
		options?: FindOptions,
	) => Subscription<Array<ISubscription> | []>;
};

export const UserContext = createContext<UserContextValue>({
	userId: null,
	user: null,
	loginWithPassword: async () => undefined,
	logout: () => Promise.resolve(),
	queryPreference: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	querySubscription: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	queryRoom: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	querySubscriptions: () => ({
		getCurrentValue: (): [] => [],
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
});

export const useUserId = (): string | null => useContext(UserContext).userId;

export const useUser = (): Meteor.User | null => useContext(UserContext).user;

export const useLoginWithPassword = (): ((
	user: string | object,
	password: string,
) => Promise<void>) => useContext(UserContext).loginWithPassword;

export const useLogout = (): (() => void) => {
	const router = useRoute('home');
	const { logout } = useContext(UserContext);

	const handleLogout = useMutableCallback(() => {
		logout();
		router.push({});
	});

	return handleLogout;
};

export const useUserPreference = <T>(key: string, defaultValue?: T): T | undefined => {
	const { queryPreference } = useContext(UserContext);
	const subscription = useMemo(
		() => queryPreference(key, defaultValue),
		[queryPreference, key, defaultValue],
	);
	return useSubscription(subscription);
};

export const useUserSubscription = (rid: string, fields: Fields): ISubscription | undefined => {
	const { querySubscription } = useContext(UserContext);
	const subscription = useMemo(
		() => querySubscription({ rid }, fields),
		[querySubscription, rid, fields],
	);
	return useSubscription(subscription);
};

export const useUserRoom = (rid: string, fields?: Fields): IRoom | undefined => {
	const { queryRoom } = useContext(UserContext);
	const subscription = useMemo(() => queryRoom({ _id: rid }, fields), [queryRoom, rid, fields]);
	return useSubscription(subscription);
};

export const useUserSubscriptions = (
	query: SubscriptionQuery,
	options?: FindOptions,
): Array<ISubscription> | [] => {
	const { querySubscriptions } = useContext(UserContext);
	const subscription = useMemo(
		() => querySubscriptions(query, options),
		[querySubscriptions, query, options],
	);
	return useSubscription(subscription);
};

export const useUserSubscriptionByName = (
	name: string,
	fields: Fields,
	sort?: Sort,
): ISubscription | undefined => {
	const { querySubscription } = useContext(UserContext);
	const subscription = useMemo(
		() => querySubscription({ name }, fields, sort),
		[querySubscription, name, fields, sort],
	);
	return useSubscription(subscription);
};
