export type AppsStatisticsResult = {
	totalInstalled: number | false;
	totalActive: number | false;
	totalFailed: number | false;
};

export interface IAppsStatisticsService {
	getStatistics: () => Promise<AppsStatisticsResult>;
}
