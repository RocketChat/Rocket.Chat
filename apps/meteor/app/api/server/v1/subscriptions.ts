import type { ISubscription } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import {
	ajv,
	isSubscriptionsGetProps,
	isSubscriptionsGetOneProps,
	isSubscriptionsReadProps,
	isSubscriptionsUnreadProps,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { readMessages } from '../../../../server/lib/readMessages';
import { getSubscriptions } from '../../../../server/publications/subscription';
import { unreadMessages } from '../../../message-mark-as-unread/server/unreadMessages';
import { API } from '../api';

API.v1.addRoute(
	'subscriptions.get',
	{
		authRequired: true,
		validateParams: isSubscriptionsGetProps,
	},
	{
		async get() {
			const { updatedSince } = this.queryParams;

			let updatedSinceDate: Date | undefined;
			if (updatedSince) {
				if (isNaN(Date.parse(updatedSince as string))) {
					throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
				}
				updatedSinceDate = new Date(updatedSince as string);
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
	},
);

const subscriptionsGetOneResponseSchema = ajv.compile<{ subscription: ISubscription | null }>({
	type: 'object',
	properties: {
		subscription: { type: 'object', nullable: true },
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
		body: isSubscriptionsReadProps,
		response: {
			200: voidSuccessResponseSchema,
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
