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
