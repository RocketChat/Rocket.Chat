import type { IStats } from '../../IStats';

export type StatisticsEndpoints = {
	statistics: {
		GET: (params: { refresh?: boolean }) => IStats;
	};
};
