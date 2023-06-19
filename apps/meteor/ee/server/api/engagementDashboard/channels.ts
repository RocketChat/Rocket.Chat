import { check, Match } from 'meteor/check';

import { API } from '../../../../app/api/server';
import { findAllChannelsWithNumberOfMessages } from '../../lib/engagementDashboard/channels';
import { isDateISOString, mapDateForAPI } from '../../lib/engagementDashboard/date';
import { getPaginationItems } from '../../../../app/api/server/helpers/getPaginationItems';

API.v1.addRoute(
	'engagement-dashboard/channels/list',
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
					offset: Match.Maybe(String),
					count: Match.Maybe(String),
				}),
			);

			const { start, end } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			const { channels, total } = await findAllChannelsWithNumberOfMessages({
				start: mapDateForAPI(start),
				end: mapDateForAPI(end),
				options: { offset, count },
			});

			return API.v1.success({
				channels,
				total,
				offset,
				count: channels.length,
			});
		},
	},
);
