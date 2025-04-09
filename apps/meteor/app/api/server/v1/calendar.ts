import { Calendar } from '@rocket.chat/core-services';
import {
	isCalendarEventListProps,
	isCalendarEventCreateProps,
	isCalendarEventImportProps,
	isCalendarEventInfoProps,
	isCalendarEventUpdateProps,
	isCalendarEventDeleteProps,
} from '@rocket.chat/rest-typings';

import { API } from '../api';

API.v1.addRoute(
	'calendar-events.list',
	{ authRequired: true, validateParams: isCalendarEventListProps, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 } },
	{
		async get() {
			const { userId } = this;
			const { date } = this.queryParams;

			const data = await Calendar.list(userId, new Date(date));

			return API.v1.success({ data });
		},
	},
);

API.v1.addRoute(
	'calendar-events.info',
	{ authRequired: true, validateParams: isCalendarEventInfoProps, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 } },
	{
		async get() {
			const { userId } = this;
			const { id } = this.queryParams;

			const event = await Calendar.get(id);

			if (!event || event.uid !== userId) {
				return API.v1.failure();
			}

			return API.v1.success({ event });
		},
	},
);

API.v1.addRoute(
	'calendar-events.create',
	{ authRequired: true, validateParams: isCalendarEventCreateProps },
	{
		async post() {
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
	},
);

API.v1.addRoute(
	'calendar-events.import',
	{ authRequired: true, validateParams: isCalendarEventImportProps },
	{
		async post() {
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
	},
);

API.v1.addRoute(
	'calendar-events.update',
	{ authRequired: true, validateParams: isCalendarEventUpdateProps },
	{
		async post() {
			const { userId } = this;
			const { eventId, startTime, endTime, subject, description, meetingUrl, reminderMinutesBeforeStart, busy } = this.bodyParams;

			const event = await Calendar.get(eventId);

			if (!event || event.uid !== userId) {
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
	},
);

API.v1.addRoute(
	'calendar-events.delete',
	{ authRequired: true, validateParams: isCalendarEventDeleteProps },
	{
		async post() {
			const { userId } = this;
			const { eventId } = this.bodyParams;

			const event = await Calendar.get(eventId);

			if (!event || event.uid !== userId) {
				throw new Error('invalid-calendar-event');
			}

			await Calendar.delete(eventId);

			return API.v1.success();
		},
	},
);
