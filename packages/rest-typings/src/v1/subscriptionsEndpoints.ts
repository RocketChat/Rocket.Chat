import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv();

type SubscriptionsGet = { updatedSince: string };

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

type SubscriptionsGetOne = { roomId: IRoom['_id'] };

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

type SubscriptionsRead = { rid: IRoom['_id'] };

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

type SubscriptionsUnread = { roomId: IRoom['_id'] };

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
