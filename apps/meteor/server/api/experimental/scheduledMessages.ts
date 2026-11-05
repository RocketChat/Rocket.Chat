import { ScheduledMessage } from '@rocket.chat/core-services';
import type { IMessage, IScheduledMessage } from '@rocket.chat/core-typings';
import type { ExperimentalEndpoints } from '@rocket.chat/rest-typings';
import { ajv, ajvQuery, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { normalizeMessagesForUser } from '../../lib/utils/lib/normalizeMessagesForUser';
import { API } from '../api';
import { getPaginationItems } from '../lib/getPaginationItems';

type Params<P extends keyof ExperimentalEndpoints, M extends keyof ExperimentalEndpoints[P]> = ExperimentalEndpoints[P][M] extends (
	params: infer T,
) => unknown
	? T
	: never;
type CreateBody = Params<'/experimental/scheduledMessages.create', 'POST'>;
type UpdateBody = Params<'/experimental/scheduledMessages.update', 'POST'>;
type IdBody = Params<'/experimental/scheduledMessages.delete', 'POST'>;
type ListQuery = Params<'/experimental/scheduledMessages.list', 'GET'>;

const filesSchema = {
	type: 'array',
	items: {
		type: 'object',
		properties: { _id: { type: 'string', minLength: 1 }, name: { type: 'string' }, description: { type: 'string' } },
		required: ['_id', 'name'],
		additionalProperties: false,
	},
};

const contentSchema = {
	type: 'object',
	properties: {
		algorithm: { type: 'string', const: 'rc.v2.aes-sha2' },
		kid: { type: 'string', minLength: 1 },
		iv: { type: 'string', minLength: 1 },
		ciphertext: { type: 'string', minLength: 1 },
	},
	required: ['algorithm', 'kid', 'iv', 'ciphertext'],
	additionalProperties: false,
};

const e2eMentionsSchema = {
	type: 'object',
	properties: {
		e2eUserMentions: { type: 'array', items: { type: 'string' } },
		e2eChannelMentions: { type: 'array', items: { type: 'string' } },
	},
	additionalProperties: false,
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
		t: { type: 'string', enum: ['e2e'] },
		content: contentSchema,
		e2eMentions: e2eMentionsSchema,
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
		content: contentSchema,
		e2eMentions: e2eMentionsSchema,
	},
	required: ['scheduledMessageId'],
	anyOf: [{ required: ['msg'] }, { required: ['scheduledAt'] }, { required: ['files'] }, { required: ['content'] }],
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

API.experimental
	.post(
		'scheduledMessages.create',
		{ authRequired: true, body: isCreateBody, response: { 200: scheduledMessageResponse, ...errorResponses } },
		async function action() {
			const { scheduledAt, ...params } = this.bodyParams;
			const scheduledMessage = await ScheduledMessage.create(this.userId, { ...params, scheduledAt: new Date(scheduledAt) });
			return API.experimental.success({ scheduledMessage });
		},
	)
	.get(
		'scheduledMessages.list',
		{ authRequired: true, query: isListQuery, response: { 200: listResponse, ...errorResponses } },
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { scheduledMessages, total } = await ScheduledMessage.list(this.userId, { offset, count });
			return API.experimental.success({ scheduledMessages, total, offset, count });
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
			return API.experimental.success({ scheduledMessage });
		},
	)
	.post(
		'scheduledMessages.sendNow',
		{ authRequired: true, body: isIdBody, response: { 200: messageResponse, ...errorResponses } },
		async function action() {
			const sent = await ScheduledMessage.sendNow(this.userId, this.bodyParams.scheduledMessageId);
			const [message] = await normalizeMessagesForUser([sent], this.userId);
			return API.experimental.success({ message });
		},
	)
	.post(
		'scheduledMessages.delete',
		{ authRequired: true, body: isIdBody, response: { 200: successResponse, ...errorResponses } },
		async function action() {
			await ScheduledMessage.delete(this.userId, this.bodyParams.scheduledMessageId);
			return API.experimental.success();
		},
	);
