import { InstanceStatus } from '@rocket.chat/models';

import { Instance as InstanceService } from '../../../../ee/server/sdk';
import { isRunningMs } from '../../../../server/lib/isRunningMs';
import { API } from '../api';

const getMatrixInstances = (() => {
	if (isRunningMs()) {
		return () => [];
	}

	return () => InstanceService.getInstances();
})();

API.v1.addRoute(
	'instances.get',
	{ authRequired: true, permissionsRequired: ['view-statistics'] },
	{
		async get() {
			const instanceRecords = await InstanceStatus.find().toArray();

			const connections = await getMatrixInstances();

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
