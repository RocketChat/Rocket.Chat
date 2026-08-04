import type { IStats } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IStatisticsModel extends IBaseModel<IStats> {
	findLast(): Promise<IStats>;
	findMonthlyPeakConnections(): Promise<Pick<IStats, 'dailyPeakConnections' | 'createdAt'> | null>;
	findLastStatsToken(): Promise<IStats['statsToken']>;
	findInstallationDates(): Promise<Pick<IStats, 'version' | 'installedAt'>[]>;
}
