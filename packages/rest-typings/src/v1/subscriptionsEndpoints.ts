import type { ISubscription, IMessage, IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

type SubscriptionsGet = { updatedSince: string };

type SubscriptionsGetOne = { roomId: IRoom['_id'] };

type SubscriptionsRead = { rid: IRoom['_id'] };

type SubscriptionsUnread = { roomId: IRoom['_id'] };

const ajv = new Ajv({
	coerceTypes: true,
});

const SubscriptionsGetSchema = {
	type: 'object',
	properties: {
		updatedSince: {
			type: 'string',
		},
	},
	required: ['updatedSince'],
	additionalProperties: false,
};

export const isSubscriptionsGetProps = ajv.compile(SubscriptionsGetSchema);

const SubscriptionsGetOneSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isSubscriptionsGetOneProps = ajv.compile(SubscriptionsGetOneSchema);

const SubscriptionsReadSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
	},
	required: ['rid'],
	additionalProperties: false,
};

export const isSubscriptionsReadProps = ajv.compile(SubscriptionsReadSchema);

const SubscriptionsUnreadSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isSubscriptionsUnreadProps = ajv.compile(SubscriptionsUnreadSchema);

export type SubscriptionsEndpoints = {
	'subscriptions.get': {
		GET: (params: SubscriptionsGet) => {
			update: ISubscription[];
			remove: Pick<ISubscription, '_id' | '_deletedAt'>[];
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
