import type { IMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canSendMessageAsync } from '../../../authorization/server/functions/canSendMessage';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.post(
	'chat.scheduleMessage',
	{
		authRequired: true,
		response: {
			200: ajv.compile<{ message: IMessage }>({
				type: 'object',
				properties: {
					message: { $ref: '#/components/schemas/IMessage' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['message', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action(this: any) {
		check(this.bodyParams, {
			roomId: String,
			message: String,
			scheduledAt: String,
			tmid: Match.Maybe(String),
		});

		const { roomId, message, scheduledAt, tmid } = this.bodyParams as {
			roomId: string;
			message: string;
			scheduledAt: string;
			tmid?: string;
		};

		const scheduledDate = new Date(scheduledAt);
		if (isNaN(scheduledDate.getTime())) {
			throw new Meteor.Error('error-invalid-date', 'Invalid date format', { method: 'chat.scheduleMessage' });
		}

		if (scheduledDate <= new Date()) {
			throw new Meteor.Error('error-past-date', 'Scheduled date must be in the future', { method: 'chat.scheduleMessage' });
		}

		try {
			await canSendMessageAsync(roomId, this.user);
		} catch (error: any) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'chat.scheduleMessage' });
		}

		const messageData = {
			rid: roomId,
			msg: message,
			u: {
				_id: this.user._id,
				username: this.user.username,
				name: this.user.name,
			},
			ts: new Date(),
			scheduledAt: scheduledDate,
			scheduled: true,
			...(tmid && { tmid }),
		};

		const result = await Messages.insertOne(messageData as IMessage);

		return API.v1.success({
			message: {
				...messageData,
				_id: result.insertedId,
				_updatedAt: new Date(),
			},
		});
	},
);

API.v1.get(
	'chat.getScheduledMessages',
	{
		authRequired: true,
		response: {
			200: ajv.compile<{ messages: IMessage[]; count: number; offset: number; total: number }>({
				type: 'object',
				properties: {
					messages: { type: 'array', items: { $ref: '#/components/schemas/IMessage' } },
					count: { type: 'number' },
					offset: { type: 'number' },
					total: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['messages', 'count', 'offset', 'total', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action(this: any) {
		const { roomId } = this.queryParams;
		const { offset, count } = await getPaginationItems(this.queryParams);

		check(roomId, String);

		try {
			await canSendMessageAsync(roomId, this.user);
		} catch (error: any) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'chat.getScheduledMessages' });
		}

		const messages = await Messages.find(
			{
				rid: roomId,
				'u._id': this.userId,
				scheduled: true,
				scheduledAt: { $exists: true },
			},
			{
				sort: { scheduledAt: 1 },
				skip: Number(offset),
				limit: Number(count),
			},
		).toArray();

		const total = await Messages.countDocuments({
			rid: roomId,
			'u._id': this.userId,
			scheduled: true,
			scheduledAt: { $exists: true },
		});

		return API.v1.success({
			messages,
			count: messages.length,
			offset,
			total,
		});
	},
);

API.v1.post(
	'chat.cancelScheduledMessage',
	{
		authRequired: true,
		response: {
			200: ajv.compile<{ success: boolean }>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [true] },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action(this: any) {
		check(this.bodyParams, {
			messageId: String,
		});

		const { messageId } = this.bodyParams as { messageId: string };

		const result = await Messages.deleteOne({
			_id: messageId,
			'u._id': this.userId,
			scheduled: true,
		});

		if (result.deletedCount === 0) {
			throw new Meteor.Error('error-message-not-found', 'Scheduled message not found or already sent', {
				method: 'chat.cancelScheduledMessage',
			});
		}

		return API.v1.success({ success: true });
	},
);
