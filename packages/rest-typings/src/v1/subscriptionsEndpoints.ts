import type { ISubscription, IMessage, IRoom } from '@rocket.chat/core-typings';

import { ajv } from '../helpers/schemas';

type SubscriptionsGet = { updatedSince?: string };

type SubscriptionsGetOne = { roomId: IRoom['_id'] };

type SubscriptionsRead = { rid: IRoom['_id']; readThreads?: boolean } | { roomId: IRoom['_id']; readThreads?: boolean };

type SubscriptionsUnread = { roomId: IRoom['_id'] } | { firstUnreadMessage: Pick<IMessage, '_id'> };

const SubscriptionsGetSchema = {
	type: 'object',
	properties: {
		updatedSince: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isSubscriptionsGetProps = ajv.compile<SubscriptionsGet>(SubscriptionsGetSchema);

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

export const isSubscriptionsGetOneProps = ajv.compile<SubscriptionsGetOne>(SubscriptionsGetOneSchema);

const SubscriptionsReadSchema = {
	anyOf: [
		{
			type: 'object',
			properties: {
				rid: {
					type: 'string',
				},
				readThreads: {
					type: 'boolean',
					nullable: true,
				},
			},
			required: ['rid'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				readThreads: {
					type: 'boolean',
					nullable: true,
				},
			},
			required: ['roomId'],
			additionalProperties: false,
		},
	],
};

export const isSubscriptionsReadProps = ajv.compile<SubscriptionsRead>(SubscriptionsReadSchema);

const SubscriptionsUnreadSchema = {
	anyOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
			},
			required: ['roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				firstUnreadMessage: {
					type: 'object',
					properties: {
						_id: {
							type: 'string',
						},
					},
					required: ['_id'],
					additionalProperties: false,
				},
			},
			required: ['firstUnreadMessage'],
			additionalProperties: false,
		},
	],
};

export const isSubscriptionsUnreadProps = ajv.compile<SubscriptionsUnread>(SubscriptionsUnreadSchema);

export type SubscriptionsEndpoints = {
	'/v1/subscriptions.get': {
		GET: (params: SubscriptionsGet) => {
			update: ISubscription[];
			remove: (Pick<ISubscription, '_id'> & { _deletedAt: Date })[];
		};
	};

	'/v1/subscriptions.getOne': {
		GET: (params: SubscriptionsGetOne) => {
			subscription: ISubscription | null;
		};
	};

	'/v1/subscriptions.read': {
		POST: (params: SubscriptionsRead) => void;
	};

	'/v1/subscriptions.unread': {
		POST: (params: SubscriptionsUnread) => void;
	};
};
