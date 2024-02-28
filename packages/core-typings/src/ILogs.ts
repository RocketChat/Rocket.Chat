export interface ILogEntry {
	args: string[];
	caller: string;
	severity: string;
	timestamp: string;
}

export interface ILogItem {
	appId: string;
	endTime: string;
	entries: ILogEntry[];
	instanceId: string;
	method: string;
	startTime: string;
	totalTime: number;
	_createdAt: string;
	_id: string;
	_updatedAt: string;
}
