import type { AppStatistics } from '../../../ee/app/apps/statisticsService';

export interface IAppsStatisticsService {
	getStatistics: () => AppStatistics;
}
