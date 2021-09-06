import { FromApi } from '../../../../../../definition/FromApi';
import { IDailyActiveUsers } from '../../../../../../definition/IUser';

export type EngagementDashboardEndpoints = {
	'engagement-dashboard/users/active-users': {
		GET: (params: { start: string; end: string }) => {
			success: true;
			month: FromApi<IDailyActiveUsers>[];
		};
	};
};
