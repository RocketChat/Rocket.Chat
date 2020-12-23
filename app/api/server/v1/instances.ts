import { getInstances } from '../../../../server/stream/streamBroadcast';
import { hasPermission } from '../../../authorization/server';
import { API } from '../api';
import InstanceStatus from '../../../models/server/models/InstanceStatus';

API.v1.addRoute('instances.get', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-statistics')) {
			return API.v1.unauthorized();
		}

		const connectedInstances = getInstances();
		const connectedInstancesIds = connectedInstances.map((x) => x.instanceRecord._id);
		const currentInstanceStatus = InstanceStatus.find({ _id: { $nin: connectedInstancesIds } }).fetch();

		const instances = {
			current: {
				instanceRecord: currentInstanceStatus,
			},
			connections: connectedInstances,
		};

		return API.v1.success({ instances });
	},
});
