import { check, Match } from 'meteor/check';

import { API } from '../../../../app/api/server';
import {
	findWeeklyMessagesSentData,
	findMessagesSentOrigin,
	findTopFivePopularChannelsByMessageSentQuantity,
} from '../../lib/engagementDashboard/messages';
import { isDateISOString, transformDatesForAPI } from '../../lib/engagementDashboard/date';

API.v1.addRoute(
	'engagement-dashboard/messages/messages-sent',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
	},
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					start: Match.Where(isDateISOString),
					end: Match.Where(isDateISOString),
				}),
			);

			const { start, end } = this.queryParams;

			const data = await findWeeklyMessagesSentData(transformDatesForAPI(start, end));
			return API.v1.success(data);
		},
	},
);

API.v1.addRoute(
	'engagement-dashboard/messages/origin',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
	},
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					start: Match.Where(isDateISOString),
					end: Match.Where(isDateISOString),
				}),
			);

			const { start, end } = this.queryParams;

			const data = await findMessagesSentOrigin(transformDatesForAPI(start, end));
			return API.v1.success(data);
		},
	},
);

API.v1.addRoute(
	'engagement-dashboard/messages/top-five-popular-channels',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
	},
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					start: Match.Where(isDateISOString),
					end: Match.Where(isDateISOString),
				}),
			);

			const { start, end } = this.queryParams;

			const data = await findTopFivePopularChannelsByMessageSentQuantity(transformDatesForAPI(start, end));
			return API.v1.success(data);
		},
	},
);
