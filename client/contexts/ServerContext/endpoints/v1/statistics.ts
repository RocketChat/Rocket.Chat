import type { IStats } from '../../../../../definition/IStats';

export type StatisticsEndpoints = {
	statistics: {
		GET: (params: { refresh?: boolean }) => IStats;
	};
};
