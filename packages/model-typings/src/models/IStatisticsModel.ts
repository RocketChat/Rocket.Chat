import type { IStats } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IStatisticsModel extends IBaseModel<IStats> {
	findLast(): Promise<IStats>;
	findMaxMonthlyPeakConnections(): Promise<Pick<IStats, 'dailyPeakConnections' | 'createdAt'> | undefined>;
}
