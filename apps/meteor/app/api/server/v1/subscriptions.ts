import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
import {
	ajv,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	isSubscriptionsGetProps,
	isSubscriptionsReadProps,
	isSubscriptionsUnreadProps,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { readMessages } from '../../../../server/lib/readMessages';
import { getSubscriptions } from '../../../../server/publications/subscription';
import { unreadMessages } from '../../../message-mark-as-unread/server/unreadMessages';
import type { ExtractRoutesFromAPI } from '../ApiClass';
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

const isSubscriptionsGetOneProps = ajv.compile<SubscriptionsGetOne>(SubscriptionsGetOneSchema);

const subscriptionsEndpoints = API.v1.get(
	'subscriptions.getOne',
	{
		authRequired: true,
		query: isSubscriptionsGetOneProps,
		response: {
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			200: ajv.compile<{ subscription: ISubscription | null }>({
				type: 'object',
				properties: {
					subscription: {
						anyOf: [
							{ type: 'null' },
							{
								type: 'object',
								properties: {
									_id: { type: 'string' },
									open: { type: 'boolean' },
									alert: { type: 'boolean' },
									unread: { type: 'number' },
									userMentions: { type: 'number' },
									groupMentions: { type: 'number' },
									ts: { type: 'string' },
									rid: { type: 'string' },
									u: {
										type: 'object',
										properties: {
											_id: { type: 'string' },
											username: { type: 'string' },
										},
									},
									_updatedAt: { type: 'string' },
									ls: { type: 'string' },
									name: { type: 'string' },
									fname: { type: 'string' },
									t: {
										type: 'string',
										enum: ['c', 'd', 'p', 'l', 'v'],
										description: "Type of room. 'c' = channel, 'd' = direct, 'p' = private, 'l' = livechat, 'v' = video or voice.",
									},
									roles: {
										type: 'array',
										items: { type: 'string' },
									},
									lr: { type: 'string' },
									tunread: {
										type: 'array',
										items: { type: 'string' },
									},
									tunreadUser: {
										type: 'array',
										items: { type: 'string' },
									},
								},
								required: ['_id'],
								additionalProperties: false,
							},
						],
					},
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['subscription', 'success'],
				additionalProperties: false,
			}),
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
API.v1.addRoute(
	'subscriptions.read',
	{
		authRequired: true,
		validateParams: isSubscriptionsReadProps,
	},
	{
		async post() {
			const { readThreads = false } = this.bodyParams;
			const roomId = 'rid' in this.bodyParams ? this.bodyParams.rid : this.bodyParams.roomId;

			const room = await Rooms.findOneById(roomId);
			if (!room) {
				throw new Error('error-invalid-subscription');
			}

			await readMessages(room, this.userId, readThreads);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'subscriptions.unread',
	{
		authRequired: true,
		validateParams: isSubscriptionsUnreadProps,
	},
	{
		async post() {
			await unreadMessages(
				this.userId,
				'firstUnreadMessage' in this.bodyParams ? this.bodyParams.firstUnreadMessage : undefined,
				'roomId' in this.bodyParams ? this.bodyParams.roomId : undefined,
			);

			return API.v1.success();
		},
	},
);

export type SubscriptionsEndpoints = ExtractRoutesFromAPI<typeof subscriptionsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends SubscriptionsEndpoints {}
}
