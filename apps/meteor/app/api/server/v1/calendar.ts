import { isCalendarEventListProps, isCalendarEventCreateProps, isCalendarEventUpdateProps, isCalendarEventDeleteProps } from '@rocket.chat/rest-typings';
import { Calendar } from '@rocket.chat/core-services';

import { API } from '../api';

API.v1.addRoute(
	'calendar-events.list',
	{ authRequired: true, validateParams: isCalendarEventListProps, rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 1000 } },
	{
		async get() {
			const { userId } = this;
			const { date } = this.queryParams;

			const data = await Calendar.list(userId, new Date(date));

			return API.v1.success(data);
		},
	},
);

API.v1.addRoute(
	'calendar-events.create',
	{ authRequired: true, validateParams: isCalendarEventCreateProps },
	{
		async post() {
			const { userId: uid } = this;
			const { startTime, externalId, subject, description } = this.bodyParams;

			await Calendar.create({
				uid,
				startTime: new Date(startTime),
				externalId,
				subject,
				description,
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'calendar-events.update',
	{ authRequired: true, validateParams: isCalendarEventUpdateProps },
	{
		async post() {
			const { userId } = this;
			const { eventId, startTime, subject, description } = this.bodyParams;

			const event = await Calendar.get(eventId);

			if (!event || event.uid !== userId) {
				throw new Error('invalid-calendar-event');
			}

			await Calendar.update(eventId, {
				startTime: new Date(startTime),
				subject,
				description,
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
