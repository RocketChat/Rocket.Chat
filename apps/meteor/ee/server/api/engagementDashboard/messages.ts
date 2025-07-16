import type { IDirectMessageRoom, IRoom } from '@rocket.chat/core-typings';
import { check, Match } from 'meteor/check';

import { API } from '../../../../app/api/server';
import { isDateISOString, transformDatesForAPI } from '../../lib/engagementDashboard/date';
import {
	findWeeklyMessagesSentData,
	findMessagesSentOrigin,
	findTopFivePopularChannelsByMessageSentQuantity,
} from '../../lib/engagementDashboard/messages';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/engagement-dashboard/messages/origin': {
			GET: (params: { start: string; end: string }) => {
				origins: {
					t: IRoom['t'];
					messages: number;
				}[];
			};
		};
		'/v1/engagement-dashboard/messages/top-five-popular-channels': {
			GET: (params: { start: string; end: string }) => {
				channels: {
					t: IRoom['t'];
					messages: number;
					name: IRoom['name'] | IRoom['fname'];
					usernames?: IDirectMessageRoom['usernames'];
				}[];
			};
		};
		'/v1/engagement-dashboard/messages/messages-sent': {
			GET: (params: { start: string; end: string }) => {
				days: { day: Date; messages: number }[];
				period: {
					count: number;
					variation: number;
				};
				yesterday: {
					count: number;
					variation: number;
				};
			};
		};
	}
}

API.v1.addRoute(
	'engagement-dashboard/messages/messages-sent',
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
		license: ['engagement-dashboard'],
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
		license: ['engagement-dashboard'],
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
