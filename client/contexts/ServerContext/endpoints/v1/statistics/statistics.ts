import type { IStats } from '../../../../../../definition/IStats';

type Params = {
	refresh?: boolean;
};

export type StatisticsEndpoint = {
	GET: (params: Params) => IStats;
};
