import type { IServiceClass } from './ServiceClass';

export type ConversationData = {
	head: { name: string }[];
	data: { name: string; value: string }[];
};

export type AgentOverviewDataOptions = {
	departmentId?: string;
	utcOffset?: number;
	daterange?: {
		from: string;
		to: string;
	};
	chartOptions: {
		name: string;
	};
};

export type ChartDataOptions = {
	departmentId?: string;
	utcOffset?: number;
	daterange?: {
		from: string;
		to: string;
	};
	chartOptions: {
		name: string;
	};
};

export type AnalyticsOverviewDataOptions = {
	departmentId?: string;
	utcOffset?: number;
	language: string;
	daterange?: {
		from: string;
		to: string;
	};
	analyticsOptions: {
		name: string;
	};
};

export type ChartDataResult = {
	chartLabel: string;
	dataLabels: string[];
	dataPoints: number[];
};

export type AnalyticsOverviewDataResult = {
	title: string;
	value: any;
};

export interface IOmnichannelAnalyticsService extends IServiceClass {
	getAgentOverviewData(options: AgentOverviewDataOptions): Promise<ConversationData | void>;
	getAnalyticsChartData(options: ChartDataOptions): Promise<ChartDataResult | void>;
	getAnalyticsOverviewData(options: AnalyticsOverviewDataOptions): Promise<AnalyticsOverviewDataResult[] | void>;
}
