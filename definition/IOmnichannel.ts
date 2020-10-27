export interface IQueue {
	_id: string;
	startedAt: Date;
	stoppedAt?: Date;
	locked: boolean;
}
