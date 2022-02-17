import { IInstance } from './IInstance';

export interface IInstanceStatus extends IInstance {
	_id: string;
	extraInformation?: {
		port?: number;
	};

	// connection props
	broadcastAuth: boolean;
}
