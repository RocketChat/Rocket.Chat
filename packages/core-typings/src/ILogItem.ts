export interface ILogItem {
	appId: string;
	endTime: string;
	entries: {
		args: string[];
		caller: string;
		severity: string;
		timestamp: string;
		method?: string;
	}[];
	instanceId: string;
	method: string;
	startTime: string;
	totalTime: number;
	_createdAt: string;
	_id: string;
	_updatedAt: string;
}
