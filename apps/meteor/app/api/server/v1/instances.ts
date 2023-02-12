import { InstanceStatus } from '@rocket.chat/models';

import { Instance as InstanceService } from '../../../../ee/server/sdk';
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

			const instanceRecords = await InstanceStatus.find().toArray();

			const connections = await InstanceService.getInstances();

			const result = instanceRecords.map((instanceRecord) => {
				const connection = connections.find((c) => c.id === instanceRecord._id);

				return {
					address: connection?.ipList[0],
					currentStatus: {
						connected: connection?.available || false,
						lastHeartbeatTime: connection?.lastHeartbeatTime,
						local: connection?.local,
					},
					instanceRecord,
					broadcastAuth: true,
				};
			});

			return API.v1.success({
				instances: result,
			});
		},
	},
);
