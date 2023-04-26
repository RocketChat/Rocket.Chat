export type AppStatistics = {
	totalInstalled: number | false;
	totalActive: number | false;
	totalFailed: number | false;
};
export interface IAppsStatisticsService {
	getStatistics: () => AppStatistics;
}
