import type { IInstanceStatus, IInstanceRecord } from '@rocket.chat/core-typings';

export type InstancesEndpoints = {
	'/v1/instances.get': {
		GET: () => {
			instances: (IInstanceRecord | (IInstanceRecord & Omit<IInstanceStatus, 'instanceRecord'>))[];
		};
	};
};
