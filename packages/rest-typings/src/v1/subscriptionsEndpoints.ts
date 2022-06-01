import type { ISubscription, IMessage, IRoom } from '@rocket.chat/core-typings';

export type SubscriptionsGet = { updatedSince: string };

export type SubscriptionsGetOne = { roomId: IRoom['_id'] };

export type SubscriptionsRead = { rid: IRoom['_id'] };

export type SubscriptionsUnread = { roomId: IRoom['_id'] };

export type SubscriptionsEndpoints = {
	'subscriptions.get': {
		GET: (params: SubscriptionsGet) => {
			update: ISubscription[];
			remove: ISubscription[];
		};
	};

	'subscriptions.getOne': {
		GET: (params: SubscriptionsGetOne) => {
			subscription: ISubscription | null;
		};
	};

	'subscriptions.read': {
		POST: (params: SubscriptionsRead) => void;
	};

	'subscriptions.unread': {
		POST: (params: SubscriptionsUnread | { firstUnreadMessage: Pick<IMessage, '_id'> }) => void;
	};
};
