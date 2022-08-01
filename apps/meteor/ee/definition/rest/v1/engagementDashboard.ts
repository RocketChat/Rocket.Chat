import type { IDirectMessageRoom, IRoom, IUser } from '@rocket.chat/core-typings';

declare module '@rocket.chat/rest-typings' {
	interface Endpoints {
		'/v1/engagement-dashboard/channels/list': {
			GET: (params: { start: string; end: string; offset: number; count: number }) => {
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
		'/v1/engagement-dashboard/users/active-users': {
			GET: (params: { start: string; end: string }) => {
				month: {
					day: number;
					month: number;
					year: number;
					usersList: IUser['_id'][];
					users: number;
				}[];
			};
		};
		'/v1/engagement-dashboard/users/chat-busier/weekly-data': {
			GET: (params: { start: string }) => {
				month: {
					users: number;
					day: number;
					month: number;
					year: number;
				}[];
			};
		};
		'/v1/engagement-dashboard/users/chat-busier/hourly-data': {
			GET: (params: { start: string }) => {
				hours: {
					users: number;
					hour: number;
				}[];
			};
		};
		'/v1/engagement-dashboard/users/users-by-time-of-the-day-in-a-week': {
			GET: (params: { start: string; end: string }) => {
				week: {
					users: number;
					hour: number;
					day: number;
					month: number;
					year: number;
				}[];
			};
		};
		'/v1/engagement-dashboard/users/new-users': {
			GET: (params: { start: string; end: string }) => {
				days: { day: Date; users: number }[];
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
