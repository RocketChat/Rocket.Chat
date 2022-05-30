import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

export type SubscriptionsEndpoints = {
	'subscriptions.get': {
		GET: (params: { updatedSince: string }) => {
			update: ISubscription[];
			remove: ISubscription[];
		};
	};

	'subscriptions.getOne': {
		GET: (params: { roomId: IRoom['_id'] }) => {
			subscription: ISubscription | null;
		};
	};

	'subscriptions.read': {
		POST: (params: { rid: IRoom['_id'] }) => void;
	};

	'subscriptions.unread': {
		POST: (params: { roomId: IRoom['_id'] } | { firstUnreadMessage: Pick<IMessage, '_id'> }) => void;
	};
};
