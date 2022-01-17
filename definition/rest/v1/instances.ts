import { IInstanceStatus } from '../../IInstanceStatus';

export type InstancesEndpoints = {
	'instances.get': {
		GET: () => {
			instances: (
				| IInstanceStatus
				| {
						connection: {
							address: unknown;
							currentStatus: unknown;
							instanceRecord: unknown;
							broadcastAuth: unknown;
						};
				  }
			)[];
		};
	};
};
