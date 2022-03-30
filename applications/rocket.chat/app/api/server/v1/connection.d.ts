import { IInstanceStatus } from '../../../../definition/IInstanceStatus';

export declare const connection:
	| {
			_id: string;
			address: string;
			currentStatus: IInstanceStatus['currentStatus'];
			instanceRecord: IInstanceStatus['instanceRecord'];
			broadcastAuth: boolean;
	  }
	| undefined;

export as namespace connection;
