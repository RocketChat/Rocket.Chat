import type { AppStatistcs } from '../../services/apps/statisticsService';

export interface IAppsStatisticsService {
	getStatistics: () => AppStatistcs;
}
