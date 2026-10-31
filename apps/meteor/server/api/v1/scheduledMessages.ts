import { ScheduledMessage } from '@rocket.chat/core-services';
import type { IMessage, IScheduledMessage } from '@rocket.chat/core-typings';
import { ajv, ajvQuery, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { normalizeMessagesForUser } from '../../lib/utils/lib/normalizeMessagesForUser';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../lib/getPaginationItems';

type CreateBody = {
	rid: string;
	msg: string;
	scheduledAt: string;
	tmid?: string;
	tshow?: boolean;
	files?: { _id: string; name: string; description?: string }[];
};
type UpdateBody = { scheduledMessageId: string; msg?: string; scheduledAt?: string; files?: CreateBody['files'] };
type IdBody = { scheduledMessageId: string };
type ListQuery = { roomId?: string; offset?: number; count?: number };

const filesSchema = {
	type: 'array',
	items: {
		type: 'object',
		properties: { _id: { type: 'string', minLength: 1 }, name: { type: 'string' }, description: { type: 'string' } },
		required: ['_id', 'name'],
		additionalProperties: false,
	},
};

const isCreateBody = ajv.compile<CreateBody>({
	type: 'object',
	properties: {
		rid: { type: 'string', minLength: 1 },
		msg: { type: 'string' },
		scheduledAt: { type: 'string', format: 'date-time' },
		tmid: { type: 'string', minLength: 1 },
		tshow: { type: 'boolean' },
		files: filesSchema,
	},
	required: ['rid', 'msg', 'scheduledAt'],
	additionalProperties: false,
});

const isUpdateBody = ajv.compile<UpdateBody>({
	type: 'object',
	properties: {
		scheduledMessageId: { type: 'string', minLength: 1 },
		msg: { type: 'string' },
		scheduledAt: { type: 'string', format: 'date-time' },
		files: filesSchema,
	},
	required: ['scheduledMessageId'],
	anyOf: [{ required: ['msg'] }, { required: ['scheduledAt'] }, { required: ['files'] }],
	additionalProperties: false,
});

const isIdBody = ajv.compile<IdBody>({
	type: 'object',
	properties: { scheduledMessageId: { type: 'string', minLength: 1 } },
	required: ['scheduledMessageId'],
	additionalProperties: false,
});

const isListQuery = ajvQuery.compile<ListQuery>({
	type: 'object',
	properties: {
		roomId: { type: 'string', minLength: 1 },
		offset: { type: 'number' },
		count: { type: 'number' },
	},
	additionalProperties: false,
});

const scheduledMessageResponse = ajv.compile<{ scheduledMessage: IScheduledMessage }>({
	type: 'object',
	properties: {
		scheduledMessage: { $ref: '#/components/schemas/IScheduledMessage' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['scheduledMessage', 'success'],
	additionalProperties: false,
});

const listResponse = ajv.compile<{ scheduledMessages: IScheduledMessage[]; total: number; offset: number; count: number }>({
	type: 'object',
	properties: {
		scheduledMessages: { type: 'array', items: { $ref: '#/components/schemas/IScheduledMessage' } },
		total: { type: 'number' },
		offset: { type: 'number' },
		count: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['scheduledMessages', 'total', 'offset', 'count', 'success'],
	additionalProperties: false,
});

const messageResponse = ajv.compile<{ message: IMessage }>({
	type: 'object',
	properties: {
		message: { $ref: '#/components/schemas/IMessage' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['message', 'success'],
	additionalProperties: false,
});

const successResponse = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const errorResponses = { 400: validateBadRequestErrorResponse, 401: validateUnauthorizedErrorResponse };

const scheduledMessagesEndpoints = API.v1
	.post(
		'scheduledMessages.create',
		{ authRequired: true, body: isCreateBody, response: { 200: scheduledMessageResponse, ...errorResponses } },
		async function action() {
			const { scheduledAt, ...params } = this.bodyParams;
			const scheduledMessage = await ScheduledMessage.create(this.userId, { ...params, scheduledAt: new Date(scheduledAt) });
			return API.v1.success({ scheduledMessage });
		},
	)
	.get(
		'scheduledMessages.list',
		{ authRequired: true, query: isListQuery, response: { 200: listResponse, ...errorResponses } },
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { scheduledMessages, total } = await ScheduledMessage.list(this.userId, { rid: this.queryParams.roomId, offset, count });
			return API.v1.success({ scheduledMessages, total, offset, count });
		},
	)
	.post(
		'scheduledMessages.update',
		{ authRequired: true, body: isUpdateBody, response: { 200: scheduledMessageResponse, ...errorResponses } },
		async function action() {
			const { scheduledMessageId, scheduledAt, ...params } = this.bodyParams;
			const scheduledMessage = await ScheduledMessage.update(this.userId, scheduledMessageId, {
				...params,
				...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
			});
			return API.v1.success({ scheduledMessage });
		},
	)
	.post(
		'scheduledMessages.sendNow',
		{ authRequired: true, body: isIdBody, response: { 200: messageResponse, ...errorResponses } },
		async function action() {
			const sent = await ScheduledMessage.sendNow(this.userId, this.bodyParams.scheduledMessageId);
			const [message] = await normalizeMessagesForUser([sent], this.userId);
			return API.v1.success({ message });
		},
	)
	.post(
		'scheduledMessages.delete',
		{ authRequired: true, body: isIdBody, response: { 200: successResponse, ...errorResponses } },
		async function action() {
			await ScheduledMessage.delete(this.userId, this.bodyParams.scheduledMessageId);
			return API.v1.success();
		},
	);

type ScheduledMessagesEndpoints = ExtractRoutesFromAPI<typeof scheduledMessagesEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// oxlint-disable-next-line @typescript-eslint/no-empty-interface
	interface Endpoints extends ScheduledMessagesEndpoints {}
}
