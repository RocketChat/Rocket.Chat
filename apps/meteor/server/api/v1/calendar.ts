import { Calendar } from '@rocket.chat/core-services';
import type { ICalendarEvent } from '@rocket.chat/core-typings';
import {
	ajv,
	isCalendarEventListProps,
	isCalendarEventCreateProps,
	isCalendarEventImportProps,
	isCalendarEventInfoProps,
	isCalendarEventUpdateProps,
	isCalendarEventDeleteProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { calendarExamples } from './calendar.examples';
import { API } from '../api';

const successWithDataSchema = ajv.compile<{ data: ICalendarEvent[] }>({
	type: 'object',
	properties: {
		data: {},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['data', 'success'],
	additionalProperties: false,
});

const successWithEventSchema = ajv.compile<{ event: ICalendarEvent }>({
	type: 'object',
	properties: {
		event: { $ref: '#/components/schemas/ICalendarEvent' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['event', 'success'],
	additionalProperties: false,
});

const successWithIdSchema = ajv.compile<{ id: ICalendarEvent['_id'] }>({
	type: 'object',
	properties: {
		id: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['id', 'success'],
	additionalProperties: false,
});

const successSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

API.v1.get(
	'calendar-events.list',
	{
		summary: 'Get List of Calendar Events',
		description: `Use this endpoint to view the list of your calendar events for a specific date.`,
		examples: calendarExamples['calendar-events.list'],
		tags: ['Calendar Events'],
		authRequired: true,
		query: isCalendarEventListProps,
		rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 },
		response: {
			200: successWithDataSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { userId } = this;
		const { date } = this.queryParams;

		const data = await Calendar.list(userId, new Date(date));

		return API.v1.success({ data });
	},
);

API.v1.get(
	'calendar-events.info',
	{
		summary: 'Get Calendar Event Info',
		description: `Use this endpoint to get information about a specific calendar event.`,
		examples: calendarExamples['calendar-events.info'],
		tags: ['Calendar Events'],
		authRequired: true,
		query: isCalendarEventInfoProps,
		rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 },
		response: {
			200: successWithEventSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { userId } = this;
		const { id } = this.queryParams;

		const event = await Calendar.get(id);

		if (event?.uid !== userId) {
			return API.v1.failure();
		}

		return API.v1.success({ event });
	},
);

API.v1.post(
	'calendar-events.create',
	{
		summary: 'Create Calendar Event',
		description: `Create a new calendar event.`,
		examples: calendarExamples['calendar-events.create'],
		tags: ['Calendar Events'],
		authRequired: true,
		body: isCalendarEventCreateProps,
		response: {
			200: successWithIdSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { userId: uid } = this;
		const { startTime, endTime, externalId, subject, description, meetingUrl, reminderMinutesBeforeStart, busy } = this.bodyParams;

		const id = await Calendar.create({
			uid,
			startTime: new Date(startTime),
			...(endTime && { endTime: new Date(endTime) }),
			externalId,
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart,
			...(typeof busy === 'boolean' && { busy }),
		});

		return API.v1.success({ id });
	},
);

API.v1.post(
	'calendar-events.import',
	{
		summary: 'Import Calendar Event',
		description: `Use this endpoint to import an exteral calendar event.`,
		examples: calendarExamples['calendar-events.import'],
		tags: ['Calendar Events'],
		authRequired: true,
		body: isCalendarEventImportProps,
		response: {
			200: successWithIdSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { userId: uid } = this;
		const { startTime, endTime, externalId, subject, description, meetingUrl, reminderMinutesBeforeStart, busy } = this.bodyParams;

		const id = await Calendar.import({
			uid,
			startTime: new Date(startTime),
			...(endTime && { endTime: new Date(endTime) }),
			externalId,
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart,
			...(typeof busy === 'boolean' && { busy }),
		});

		return API.v1.success({ id });
	},
);

API.v1.post(
	'calendar-events.update',
	{
		summary: 'Update Calendar Event',
		description: `Update an existing calendar event.`,
		examples: calendarExamples['calendar-events.update'],
		tags: ['Calendar Events'],
		authRequired: true,
		body: isCalendarEventUpdateProps,
		response: {
			200: successSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { userId } = this;
		const { eventId, startTime, endTime, subject, description, meetingUrl, reminderMinutesBeforeStart, busy } = this.bodyParams;

		const event = await Calendar.get(eventId);

		if (event?.uid !== userId) {
			throw new Error('invalid-calendar-event');
		}

		await Calendar.update(eventId, {
			startTime: new Date(startTime),
			...(endTime && { endTime: new Date(endTime) }),
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart,
			...(typeof busy === 'boolean' && { busy }),
		});

		return API.v1.success();
	},
);

API.v1.post(
	'calendar-events.delete',
	{
		summary: 'Delete Calendar Event',
		description: `Delete a specific calendar event.`,
		examples: calendarExamples['calendar-events.delete'],
		tags: ['Calendar Events'],
		authRequired: true,
		body: isCalendarEventDeleteProps,
		response: {
			200: successSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { userId } = this;
		const { eventId } = this.bodyParams;

		const event = await Calendar.get(eventId);

		if (event?.uid !== userId) {
			throw new Error('invalid-calendar-event');
		}

		await Calendar.delete(eventId);

		return API.v1.success();
	},
);
