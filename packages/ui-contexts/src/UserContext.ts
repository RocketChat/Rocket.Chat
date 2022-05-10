import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { ObjectId, FilterQuery } from 'mongodb';
import { createContext } from 'react';
import type { Subscription, Unsubscribe } from 'use-subscription';

export type SubscriptionQuery =
	| {
			rid: string | ObjectId;
	  }
	| {
			name: string;
	  }
	| {
			open: boolean;
	  }
	| object;

export type Fields = {
	[key: string]: boolean;
};

export type Sort = {
	[key: string]: -1 | 1 | number;
};

export type FindOptions = {
	fields?: Fields;
	sort?: Sort;
};

export type UserContextValue = {
	userId: string | null;
	user: IUser | null;
	loginWithPassword: (user: string | object, password: string) => Promise<void>;
	logout: () => Promise<void>;
	queryPreference: <T>(key: string | ObjectId, defaultValue?: T) => Subscription<T | undefined>;
	querySubscription: (query: FilterQuery<ISubscription>, fields?: Fields, sort?: Sort) => Subscription<ISubscription | undefined>;
	queryRoom: (query: FilterQuery<IRoom>, fields?: Fields, sort?: Sort) => Subscription<IRoom | undefined>;
	querySubscriptions: (query: SubscriptionQuery, options?: FindOptions) => Subscription<Array<ISubscription> | []>;
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
