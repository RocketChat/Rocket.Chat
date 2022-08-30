import type { IInstanceRecord } from './IInstanceRecord';

export interface IInstanceStatus {
	_id: string;
	extraInformation?: {
		port?: number;
	};

	address: string;
	currentStatus: {
		connected: boolean;
		retryCount: number;
		retryTime: number;
		status: string;
	};
	instanceRecord?: IInstanceRecord;

	broadcastAuth: boolean;
}
