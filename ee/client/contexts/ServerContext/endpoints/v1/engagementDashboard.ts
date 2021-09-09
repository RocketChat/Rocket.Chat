import { IDailyActiveUsers } from '../../../../../../definition/IUser';
import { Serialized } from '../../../../../../definition/Serialized';

export type EngagementDashboardEndpoints = {
	'engagement-dashboard/users/active-users': {
		GET: (params: { start: string; end: string }) => {
			month: Serialized<IDailyActiveUsers>[];
		};
	};
};
