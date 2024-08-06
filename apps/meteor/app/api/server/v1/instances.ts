import { InstanceStatus } from '@rocket.chat/models';

import { isRunningMs } from '../../../../server/lib/isRunningMs';
import { API } from '../api';
import { getInstanceList } from '../helpers/getInstanceList';

const getConnections = (() => {
	if (isRunningMs()) {
		return () => [];
	}

	return () => getInstanceList();
})();

API.v1.addRoute(
	'instances.get',
	{ authRequired: true, permissionsRequired: ['view-statistics'] },
	{
		async get() {
			const instanceRecords = await InstanceStatus.find().toArray();

			const connections = await getConnections();

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
