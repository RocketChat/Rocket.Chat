import type { IInstanceStatus } from '@rocket.chat/core-typings';

export type InstancesEndpoints = {
	'instances.get': {
		GET: () => {
			instances: (
				| IInstanceStatus
				| {
						connection: {
							address: string;
							currentStatus: IInstanceStatus['currentStatus'];
							instanceRecord: IInstanceStatus['instanceRecord'];
							broadcastAuth: boolean;
						};
				  }
			)[];
		};
	};
};
