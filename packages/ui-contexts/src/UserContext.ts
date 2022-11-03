import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { ObjectId, Filter } from 'mongodb';
import { createContext } from 'react';

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
	queryPreference: <T>(
		key: string | ObjectId,
		defaultValue?: T,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => T | undefined];
	querySubscription: (
		query: Filter<Pick<ISubscription, 'rid' | 'name'>>,
		fields?: Fields,
		sort?: Sort,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISubscription | undefined];
	queryRoom: (
		query: Filter<Pick<IRoom, '_id'>>,
		fields?: Fields,
		sort?: Sort,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => IRoom | undefined];
	querySubscriptions: (
		query: SubscriptionQuery,
		options?: FindOptions,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => Array<ISubscription> | []];
};

export const UserContext = createContext<UserContextValue>({
	userId: null,
	user: null,
	loginWithPassword: async () => undefined,
	logout: () => Promise.resolve(),
	queryPreference: () => [() => (): void => undefined, (): undefined => undefined],
	querySubscription: () => [() => (): void => undefined, (): undefined => undefined],
	queryRoom: () => [() => (): void => undefined, (): undefined => undefined],
	querySubscriptions: () => [() => (): void => undefined, (): [] => []],
});
