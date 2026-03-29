import type { INotificationHistory } from '@rocket.chat/core-typings';
import { NotificationHistory } from '@rocket.chat/models';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { findAllActivitiesByUser, findAllMentionsByUser, findAllReactionsForUser, findAllStarredMessagesByUser } from '../lib/activityHub';

export const activityHubEndpoints = API.v1
	.get(
		'activity-hub.notifications',
		{
			authRequired: true,
			query: ajv.compile<{ count?: number; offset?: number; type?: INotificationHistory['type'] }>({
				type: 'object',
				properties: {
					count: { type: 'number', nullable: true },
					offset: { type: 'number', nullable: true },
                    type: {
						type: 'string',
						enum: ['general', 'direct', 'mention', 'reaction', 'star', 'quote', 'thread'],
						nullable: true,
					},
				},
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile<{
					notifications: INotificationHistory[];
					total: number;
					count: number;
					offset: number;
				}>({
					type: 'object',
					properties: {
						notifications: { type: 'array', items: { type: 'object' } },
						total: { type: 'number' },
						count: { type: 'number' },
						offset: { type: 'number' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['notifications', 'total', 'count', 'offset', 'success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { count = 50, offset = 0, type } = this.queryParams;
			const { cursor, totalCount } = NotificationHistory.findPaginatedByUserId(this.userId, {
				limit: count,
				skip: offset,
                type,
			});

			const [notifications, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({ notifications, total, count: notifications.length, offset });
		},
	)
	.post(
		'activity-hub.notifications.delete',
		{
			authRequired: true,
			body: ajv.compile<{ notificationId: string }>({
				type: 'object',
				properties: {
					notificationId: { type: 'string', minLength: 1 },
				},
				required: ['notificationId'],
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: { success: { type: 'boolean', enum: [true] } },
					required: ['success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { notificationId } = this.bodyParams;
			await NotificationHistory.deleteOneByIdAndUserId(notificationId, this.userId);
			return API.v1.success();
		},
	)
	.post(
		'activity-hub.notifications.clearAll',
		{
			authRequired: true,
			body: ajv.compile<Record<string, never>>({
				type: 'object',
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: { success: { type: 'boolean', enum: [true] } },
					required: ['success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			await NotificationHistory.deleteAllByUserId(this.userId);
			return API.v1.success();
		},
	)
	.get(
		'activity-hub.starredMessages',
		{
			authRequired: true,
			query: ajv.compile<{ count?: number; offset?: number }>({
				type: 'object',
				properties: {
					count: { type: 'number', nullable: true },
					offset: { type: 'number', nullable: true },
				},
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						messages: { type: 'array', items: { type: 'object' } },
						total: { type: 'number' },
						count: { type: 'number' },
						offset: { type: 'number' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['messages', 'total', 'count', 'offset', 'success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { count = 50, offset = 0 } = this.queryParams;

			const result = await findAllStarredMessagesByUser({
				uid: this.userId,
				pagination: { offset, count },
			});

			result.messages = await normalizeMessagesForUser(result.messages, this.userId);

			return API.v1.success(result);
		},
	)
	.get(
		'activity-hub.mentions',
		{
			authRequired: true,
			query: ajv.compile<{ count?: number; offset?: number }>({
				type: 'object',
				properties: {
					count: { type: 'number', nullable: true },
					offset: { type: 'number', nullable: true },
				},
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						messages: { type: 'array', items: { type: 'object' } },
						total: { type: 'number' },
						count: { type: 'number' },
						offset: { type: 'number' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['messages', 'total', 'count', 'offset', 'success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { count = 50, offset = 0 } = this.queryParams;

			const result = await findAllMentionsByUser({
				uid: this.userId,
				pagination: { offset, count },
			});

			result.messages = await normalizeMessagesForUser(result.messages, this.userId);

			return API.v1.success(result);
		},
	)
	.get(
		'activity-hub.reactions',
		{
			authRequired: true,
			query: ajv.compile<{ count?: number; offset?: number }>({
				type: 'object',
				properties: {
					count: { type: 'number', nullable: true },
					offset: { type: 'number', nullable: true },
				},
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						messages: { type: 'array', items: { type: 'object' } },
						total: { type: 'number' },
						count: { type: 'number' },
						offset: { type: 'number' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['messages', 'total', 'count', 'offset', 'success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { count = 50, offset = 0 } = this.queryParams;

			const result = await findAllReactionsForUser({
				uid: this.userId,
				pagination: { offset, count },
			});

			result.messages = await normalizeMessagesForUser(result.messages, this.userId);

			return API.v1.success(result);
		},
	)
	.get(
		'activity-hub.all',
		{
			authRequired: true,
			query: ajv.compile<{ count?: number; offset?: number }>({
				type: 'object',
				properties: {
					count: { type: 'number', nullable: true },
					offset: { type: 'number', nullable: true },
				},
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						messages: { type: 'array', items: { type: 'object' } },
						total: { type: 'number' },
						count: { type: 'number' },
						offset: { type: 'number' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['messages', 'total', 'count', 'offset', 'success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { count = 50, offset = 0 } = this.queryParams;

			const result = await findAllActivitiesByUser({
				uid: this.userId,
				pagination: { offset, count },
			});

			result.messages = await normalizeMessagesForUser(result.messages, this.userId);

            return API.v1.success(result);
		},
	);

type ActivityHubEndpoints = ExtractRoutesFromAPI<typeof activityHubEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ActivityHubEndpoints {}
}