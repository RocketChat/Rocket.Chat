import type { ISubscription, IMessage, IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

type SubscriptionsGet = { updatedSince?: string };

type SubscriptionsRead = { rid: IRoom['_id']; readThreads?: boolean } | { roomId: IRoom['_id']; readThreads?: boolean };

type SubscriptionsUnread = { roomId: IRoom['_id'] } | { firstUnreadMessage: Pick<IMessage, '_id'> };

const ajv = new Ajv({
	coerceTypes: true,
});

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

	'/v1/subscriptions.read': {
		POST: (params: SubscriptionsRead) => void;
	};

	'/v1/subscriptions.unread': {
		POST: (params: SubscriptionsUnread) => void;
	};
};
