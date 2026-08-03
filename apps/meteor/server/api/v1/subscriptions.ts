import type { ISubscription } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import {
	ajv,
	isSubscriptionsGetProps,
	isSubscriptionsGetOneProps,
	isSubscriptionsReadProps,
	isSubscriptionsUnreadProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { subscriptionsExamples } from './subscriptions.examples';
import { unreadMessages } from '../../lib/messaging/unread/unreadMessages';
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
		summary: 'Get All Subscriptions',
		description: `Get the room notification subscription details and the latest updates. Note that the unread counter value depends on your settings in the **Manage** > **Workspace** > <a href='https://docs.rocket.chat/docs/general' target='_blank'>**General**</a> section.

### Changelog
| Version      | Description | 
| ---------------- | ------------|
|0.60.0            | Added       |`,
		examples: subscriptionsExamples['subscriptions.get'],
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
				throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
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
		summary: 'Get Subscription Room',
		description: `Get the notification subscription details for a specific room. Note that the unread counter value depends on your settings at the **Manage** > **Workspace** > <a href='https://docs.rocket.chat/docs/general' target='_blank'>**General**</a> section.

### Changelog
| Version      | Description | 
| ---------------- | ------------|
|0.63.0            | Added       |`,
		examples: subscriptionsExamples['subscriptions.getOne'],
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
		summary: 'Mark Channel as Read',
		description: `### Changelog
| Version      | Description |
| ---------------- | ------------|
|3.11.0            | \`roomId\` can be used as argument instead of \`rid\`.       |
|0.61.0            | Added       |`,
		examples: subscriptionsExamples['subscriptions.read'],
		authRequired: true,
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
		summary: 'Mark Channel as Unread',
		description: `Mark messages as unread by room ID or from a message. 
### Changelog
| Version      | Description |
| ---------------- | ------------|
|0.65.0            | Added       |`,
		examples: subscriptionsExamples['subscriptions.unread'],
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
