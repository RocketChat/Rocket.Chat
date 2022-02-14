import { IInstance } from '../../IInstance';
import { IInstanceStatus } from '../../IInstanceStatus';

export type InstancesEndpoints = {
	'instances.get': {
		GET: () => {
			instances: (
				| IInstanceStatus
				| {
						connection: {
							address: string; // unknown
							currentStatus: IInstance['currentStatus']; // unknown
							instanceRecord: IInstance['instanceRecord']; // unknown
							broadcastAuth: boolean; // unknown
						};
				  }
			)[];
		};
	};
};
