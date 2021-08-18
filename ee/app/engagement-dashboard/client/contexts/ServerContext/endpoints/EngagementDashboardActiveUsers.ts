import { IDailyActiveUsers } from '../../../../../../../definition/IUser';

export type EngagementDashboardActiveUsersEndpoint = {
	GET: (params: {
		start: string;
		end: string;
	}) => {
		success: true;
		month: Array<IDailyActiveUsers>;
	};
};
