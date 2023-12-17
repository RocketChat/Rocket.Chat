export interface ICronHistoryItem {
	_id: string;
	name: string;
	intendedAt: Date;
	startedAt: Date;
	finishedAt?: Date;
	result?: any;
	error?: any;
}
