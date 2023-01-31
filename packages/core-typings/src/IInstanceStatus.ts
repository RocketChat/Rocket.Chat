import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IInstanceStatus extends IRocketChatRecord {
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
	instanceRecord?: {
		name: string;
		pid: number;
		_createdAt: Date;
		_id: string;
		_updatedAt: Date;
		extraInformation: {
			host: string;
			nodeVersion: string;
			port: string;
		};
	};

	broadcastAuth: boolean;
}
