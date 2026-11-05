import { ClientSafeError } from '@rocket.chat/core-services';
import type { ISubscription } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import {
	ajv,
	isSubscriptionsGetProps,
	isSubscriptionsGetOneProps,
	isSubscriptionsReadProps,
	isSubscriptionsSetUserArchivedProps,
	isSubscriptionsUnreadProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { unreadMessages } from '../../lib/messaging/unread/unreadMessages';
import { notifyOnSubscriptionsChangedByRoomIdsAndUserId } from '../../lib/notifyListener';
import { readMessages } from '../../lib/readMessages';
import { getSubscriptions } from '../../publications/subscription';
import { API } from '../api';

const subscriptionsGetResponseSchema = ajv.compile<{
	update: ISubscription[];
	remove: (Pick<ISubscription, '_id'> & { _deletedAt: Date })[];
}>({
	type: 'object',
	properties: {
		update: { type: 'array', items: { $ref: '#/components/schemas/ISubscription' } },
		remove: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					_deletedAt: { type: 'string', format: 'date-time' },
				},
				required: ['_id', '_deletedAt'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: true,
});

API.v1.get(
	'subscriptions.get',
	{
		authRequired: true,
		query: isSubscriptionsGetProps,
		response: {
			200: subscriptionsGetResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { updatedSince } = this.queryParams;

		let updatedSinceDate: Date | undefined;
		if (updatedSince) {
			if (isNaN(Date.parse(updatedSince))) {
				throw new ClientSafeError('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
			}
			updatedSinceDate = new Date(updatedSince);
		}

		const result = await getSubscriptions(this.userId, updatedSinceDate);

		return API.v1.success(
			Array.isArray(result)
				? {
						update: result,
						remove: [],
					}
				: result,
		);
	},
);

const subscriptionsGetOneResponseSchema = ajv.compile<{ subscription: ISubscription | null }>({
	type: 'object',
	properties: {
		subscription: { oneOf: [{ $ref: '#/components/schemas/ISubscription' }, { type: 'null' }] },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['subscription', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'subscriptions.getOne',
	{
		authRequired: true,
		query: isSubscriptionsGetOneProps,
		response: {
			200: subscriptionsGetOneResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { roomId } = this.queryParams;

		if (!roomId) {
			return API.v1.failure("The 'roomId' param is required");
		}

		return API.v1.success({
			subscription: await Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId),
		});
	},
);

/**
  This API is suppose to mark any room as read.

	Method: POST
	Route: api/v1/subscriptions.read
	Params:
		- rid: The rid of the room to be marked as read.
		- roomId: Alternative for rid.
 */
const voidSuccessResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

API.v1.post(
	'subscriptions.read',
	{
		authRequired: true,
		// The sidebar marks a whole group read with one call per room; the default of ten a minute would stop it.
		rateLimiterOptions: { numRequestsAllowed: 120, intervalTimeInMS: 60000 },
		body: isSubscriptionsReadProps,
		response: {
			200: voidSuccessResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { readThreads = false } = this.bodyParams;
		const roomId = 'rid' in this.bodyParams ? this.bodyParams.rid : this.bodyParams.roomId;

		const room = await Rooms.findOneById(roomId);
		if (!room) {
			throw new Error('error-invalid-subscription');
		}

		await readMessages(room, this.userId, readThreads);

		return API.v1.success();
	},
);

API.v1.post(
	'subscriptions.unread',
	{
		authRequired: true,
		body: isSubscriptionsUnreadProps,
		response: {
			200: voidSuccessResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		await unreadMessages(
			this.userId,
			'firstUnreadMessage' in this.bodyParams ? this.bodyParams.firstUnreadMessage : undefined,
			'roomId' in this.bodyParams ? this.bodyParams.roomId : undefined,
		);

		return API.v1.success();
	},
);

API.v1.post(
	'subscriptions.setUserArchived',
	{
		authRequired: true,
		body: isSubscriptionsSetUserArchivedProps,
		response: {
			200: voidSuccessResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { roomIds, archived } = this.bodyParams;

		// One update for the whole list: the sidebar archives a group's worth of rooms at once.
		const { matchedCount } = await Subscriptions.setUserArchivedByRoomIdsAndUserId(roomIds, this.userId, archived);
		if (!matchedCount) {
			throw new Error('error-invalid-subscription');
		}

		void notifyOnSubscriptionsChangedByRoomIdsAndUserId(roomIds, this.userId);

		return API.v1.success();
	},
);
