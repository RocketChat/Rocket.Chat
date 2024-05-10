import type { IDirectMessageRoom, IRoom } from '@rocket.chat/core-typings';
import { check, Match } from 'meteor/check';

import { API } from '../../../../app/api/server';
import { getPaginationItems } from '../../../../app/api/server/helpers/getPaginationItems';
import { findAllChannelsWithNumberOfMessages } from '../../lib/engagementDashboard/channels';
import { isDateISOString, mapDateForAPI } from '../../lib/engagementDashboard/date';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/engagement-dashboard/channels/list': {
			GET: (params: { start: string; end: string; offset?: number; count?: number }) => {
				channels: {
					room: {
						_id: IRoom['_id'];
						name: IRoom['name'] | IRoom['fname'];
						ts: IRoom['ts'];
						t: IRoom['t'];
						_updatedAt: IRoom['_updatedAt'];
						usernames?: IDirectMessageRoom['usernames'];
					};
					messages: number;
					lastWeekMessages: number;
					diffFromLastWeek: number;
				}[];
				count: number;
				offset: number;
				total: number;
			};
		};
	}
}

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
