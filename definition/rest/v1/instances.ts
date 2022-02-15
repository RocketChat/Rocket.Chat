import { IInstance } from '../../IInstance';
import { IInstanceStatus } from '../../IInstanceStatus';

export type InstancesEndpoints = {
	'instances.get': {
		GET: () => {
			instances: (
				| IInstanceStatus
				| {
						connection: {
							address: string;
							currentStatus: IInstance['currentStatus'];
							instanceRecord: IInstance['instanceRecord'];
							broadcastAuth: boolean;
						};
				  }
			)[];
		};
	};
};
