import { InstanceStatus } from '@rocket.chat/models';

import { hasPermission } from '../../../authorization/server';
import { API } from '../api';

API.v1.addRoute(
	'instances.get',
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'view-statistics')) {
				return API.v1.unauthorized();
			}

			const instances = await InstanceStatus.find().toArray();

			return API.v1.success({
				instances,
				// instances: instances.map((instance: IInstanceStatus) => {
				// 	const connection = getInstanceConnection(instance);

				// 	if (connection) {
				// 		delete connection.instanceRecord;
				// 	}
				// 	return {
				// 		...instance,
				// 		connection,
				// 	};
				// }),
			});
		},
	},
);

// TODO why?
// function getConnection(address) {
// 	const conn = connections[address];
// 	if (!conn) {
// 		return;
// 	}

// 	const { instanceRecord, broadcastAuth } = conn;

// 	return {
// 		address,
// 		currentStatus: conn._stream.currentStatus,
// 		instanceRecord,
// 		broadcastAuth,
// 	};
// }

// export function getInstanceConnection(instance) {
// 	const subPath = getURL('', { cdn: false, full: false });
// 	const address = `${instance.extraInformation.host}:${instance.extraInformation.port}${subPath}`;

// 	return getConnection(address);
// }
