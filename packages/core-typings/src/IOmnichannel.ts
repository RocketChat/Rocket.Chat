export interface IOmnichannelQueueStatus {
	_id: string;
	startedAt: Date;
	stoppedAt?: Date;
	locked: boolean;
}
