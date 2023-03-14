import { isCalendarEventListProps, isCalendarEventCreateProps, isCalendarEventUpdateProps } from '@rocket.chat/rest-typings';
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
			const { startTime, externalId, subject } = this.bodyParams;

			console.log('Calendar.create');

			await Calendar.create({
				uid,
				startTime: new Date(startTime),
				externalId,
				subject,
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
			// const { userId: uid } = this;
			// const { startTime, externalId, subject } = this.bodyParams;

			// await Calendar.update({
			// 	uid,
			// 	startTime: new Date(startTime),
			// 	externalId,
			// 	subject,
			// });

			return API.v1.success();
		},
	},
);
