import type { IScheduledMessage } from '@rocket.chat/core-typings';
import {
	ajv,
	isScheduledMessageCreateProps,
	isScheduledMessageDeleteProps,
	isScheduledMessageListProps,
	isScheduledMessageUpdateProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import {
	cancelScheduledMessage,
	listScheduledMessages,
	scheduleMessage,
	updateScheduledMessage,
} from '../../lib/messages/scheduled/scheduledMessages';
import { API } from '../api';
import { getPaginationItems } from '../lib/getPaginationItems';

/** Dates are serialized before the response is validated, so every date field is a string here. */
const scheduledMessageSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		_updatedAt: { type: 'string' },
		uid: { type: 'string' },
		rid: { type: 'string' },
		msg: { type: 'string' },
		scheduledAt: { type: 'string' },
		createdAt: { type: 'string' },
		updatedAt: { type: 'string' },
		status: { type: 'string', enum: ['scheduled', 'sending', 'sent', 'failed'] },
		slot: { type: 'number' },
		tmid: { type: 'string' },
		tshow: { type: 'boolean' },
		messageId: { type: 'string' },
		error: { type: 'string' },
		claimId: { type: 'string' },
		claimedAt: { type: 'string' },
	},
	required: ['_id', 'uid', 'rid', 'msg', 'scheduledAt', 'createdAt', 'updatedAt', 'status', 'slot'],
	additionalProperties: false,
};

const successWithScheduledMessageSchema = ajv.compile<{ scheduledMessage: IScheduledMessage }>({
	type: 'object',
	properties: {
		scheduledMessage: scheduledMessageSchema,
		success: { type: 'boolean', enum: [true] },
	},
	required: ['scheduledMessage', 'success'],
	additionalProperties: false,
});

const successWithListSchema = ajv.compile<{
	messages: IScheduledMessage[];
	count: number;
	offset: number;
	total: number;
}>({
	type: 'object',
	properties: {
		messages: { type: 'array', items: scheduledMessageSchema },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['messages', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const successSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

API.v1.post(
	'chat.scheduleMessage',
	{
		authRequired: true,
		body: isScheduledMessageCreateProps,
		response: {
			200: successWithScheduledMessageSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { rid, msg, scheduledAt, tmid, tshow } = this.bodyParams;

		const scheduledMessage = await scheduleMessage(this.user, {
			rid,
			msg,
			scheduledAt: new Date(scheduledAt),
			tmid,
			tshow,
		});

		return API.v1.success({ scheduledMessage });
	},
);

API.v1.get(
	'chat.getScheduledMessages',
	{
		authRequired: true,
		query: isScheduledMessageListProps,
		response: {
			200: successWithListSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { rid } = this.queryParams;

		const { messages, total } = await listScheduledMessages(this.userId, { rid, count, offset });

		return API.v1.success({
			messages,
			count: messages.length,
			offset,
			total,
		});
	},
);

API.v1.post(
	'chat.updateScheduledMessage',
	{
		authRequired: true,
		body: isScheduledMessageUpdateProps,
		response: {
			200: successWithScheduledMessageSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { id, msg, scheduledAt } = this.bodyParams;

		const scheduledMessage = await updateScheduledMessage(this.user, id, {
			msg,
			...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
		});

		return API.v1.success({ scheduledMessage });
	},
);

API.v1.post(
	'chat.deleteScheduledMessage',
	{
		authRequired: true,
		body: isScheduledMessageDeleteProps,
		response: {
			200: successSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		await cancelScheduledMessage(this.userId, this.bodyParams.id);

		return API.v1.success();
	},
);
