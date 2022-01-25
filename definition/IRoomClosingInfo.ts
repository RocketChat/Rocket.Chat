export interface IRoomClosingInfo {
	closedAt: Date;
	callDuration: number;
	closer?: string;
	closedBy?: Record<string, any>;
	serviceTimeDuration?: string;
	extraData?: Record<string, any>;
}
