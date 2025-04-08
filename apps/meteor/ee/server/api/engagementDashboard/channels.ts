import type { IDirectMessageRoom, IRoom } from '@rocket.chat/core-typings';
import { check, Match } from 'meteor/check';

import { API } from '../../../../app/api/server';
import { getPaginationItems } from '../../../../app/api/server/helpers/getPaginationItems';
import { apiDeprecationLogger } from '../../../../app/lib/server/lib/deprecationWarningLogger';
import { findChannelsWithNumberOfMessages } from '../../lib/engagementDashboard/channels';
import { isDateISOString, mapDateForAPI } from '../../lib/engagementDashboard/date';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/engagement-dashboard/channels/list': {
			GET: (params: { start: string; end: string; offset?: number; count?: number; hideRoomsWithNoActivity?: boolean }) => {
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
		license: ['engagement-dashboard'],
	},
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					start: Match.Where(isDateISOString),
					end: Match.Where(isDateISOString),
					hideRoomsWithNoActivity: Match.Maybe(String),
					offset: Match.Maybe(String),
					count: Match.Maybe(String),
				}),
			);

			const { start, end, hideRoomsWithNoActivity } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (hideRoomsWithNoActivity === undefined) {
				apiDeprecationLogger.deprecatedParameterUsage(
					this.request.route,
					'hideRoomsWithNoActivity',
					'7.0.0',
					this.response,
					({ parameter, endpoint, version }) =>
						`Returning rooms that had no activity in ${endpoint} is deprecated and will be removed on version ${version} along with the \`${parameter}\` param. Set \`${parameter}\` as \`true\` to check how the endpoint will behave starting on ${version}`,
				);
			}

			const { channels, total } = await findChannelsWithNumberOfMessages({
				start: mapDateForAPI(start),
				end: mapDateForAPI(end),
				hideRoomsWithNoActivity: hideRoomsWithNoActivity === 'true',
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
