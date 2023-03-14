import { Calendar } from '@rocket.chat/core-services';
import { isCalendarEventCreateProps } from '@rocket.chat/rest-typings';

import { API } from '../../../../app/api/server';
import { hasPermissionAsync } from '../../../../app/authorization/server/functions/hasPermission';

API.v1.addRoute(
	'calendar-events.create',
	{
		authRequired: true,
		validateParams: isCalendarEventCreateProps,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
	},
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'create-calendar-event'))) {
				return API.v1.unauthorized();
			}

			const { startTime, subject, externalId } = this.bodyParams;

			await Calendar.create({
				startTime: new Date(startTime),
				uid: this.userId,
				subject,
				externalId,
			});

			return API.v1.success();
		},
	},
);

// API.v1.addRoute(
// 	'calendar-events.delete',
// 	{ authRequired: true },
// 	{
// 		post() {},
// 	},
// );

API.v1.addRoute(
	'calendar-events.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, fields } = this.parseJsonQuery();

			return API.v1.success({
				
				offset,
				count: groups.length,
				total,
			});
		},
	},
);
