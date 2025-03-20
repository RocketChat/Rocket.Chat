export interface IOmnichannelQueueStatus {
	_id: string;
	startedAt: Date;
	stoppedAt?: Date;
	locked: boolean;
}

export enum OmnichannelSortingMechanismSettingType {
	Timestamp = 'Timestamp',
	Priority = 'Priority',
	SLAs = 'SLAs',
}
