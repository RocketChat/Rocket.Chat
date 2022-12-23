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

export type LoginService = {
	clientConfig: unknown;

	title: string;
	service: string;

	buttonLabelText?: string;
	icon?: string;
};

export type UserContextValue = {
	userId: string | null;
	user: IUser | null;
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

	loginWithPassword: (user: string | object, password: string) => Promise<void>;
	loginWithToken: (user: string) => Promise<void>;
	logout: () => Promise<void>;

	queryAllServices(): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => LoginService[]];
	loginWithService<T extends LoginService>(service: T): () => Promise<true>;
};

export const UserContext = createContext<UserContextValue>({
	userId: null,
	user: null,
	queryPreference: () => [() => (): void => undefined, (): undefined => undefined],
	querySubscription: () => [() => (): void => undefined, (): undefined => undefined],
	queryRoom: () => [() => (): void => undefined, (): undefined => undefined],
	querySubscriptions: () => [() => (): void => undefined, (): [] => []],

	queryAllServices: () => [() => (): void => undefined, (): LoginService[] => []],
	loginWithService: () => () => Promise.reject('loginWithService not implemented'),
	loginWithPassword: async () => Promise.reject('loginWithPassword not implemented'),
	loginWithToken: async () => Promise.reject('loginWithToken not implemented'),
	logout: () => Promise.resolve(),
});
