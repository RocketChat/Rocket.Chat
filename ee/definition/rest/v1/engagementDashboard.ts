import { IDirectMessageRoom, IRoom } from '../../../../definition/IRoom';
import { IDailyActiveUsers } from '../../../../definition/IUser';
import { Serialized } from '../../../../definition/Serialized';

export type EngagementDashboardEndpoints = {
	'/v1/engagement-dashboard/channels/list': {
		GET: (params: { start: Date; end: Date; offset: number; count: number }) => {
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
	'engagement-dashboard/messages/origin': {
		GET: (params: { start: Date; end: Date }) => {
			origins: {
				t: IRoom['t'];
				messages: number;
			}[];
		};
	};
	'engagement-dashboard/messages/top-five-popular-channels': {
		GET: (params: { start: Date; end: Date }) => {
			channels: {
				t: IRoom['t'];
				messages: number;
				name: IRoom['name'] | IRoom['fname'];
				usernames?: IDirectMessageRoom['usernames'];
			}[];
		};
	};
	'engagement-dashboard/messages/messages-sent': {
		GET: (params: { start: Date; end: Date }) => {
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
	'engagement-dashboard/users/active-users': {
		GET: (params: { start: string; end: string }) => {
			month: Serialized<IDailyActiveUsers>[];
		};
	};
};
