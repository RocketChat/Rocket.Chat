import { getInstanceConnection } from '../../../../server/stream/streamBroadcast';
import { hasPermission } from '../../../authorization/server';
import { API } from '../api';
import InstanceStatus from '../../../models/server/models/InstanceStatus';
import { IInstanceStatus } from '../../../../definition/IInstanceStatus';

API.v1.addRoute('instances.get', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-statistics')) {
			return API.v1.unauthorized();
		}

		const instances = InstanceStatus.find().fetch();

		return API.v1.success({
			instances: instances.map((instance: IInstanceStatus) => {
				const connection = getInstanceConnection(instance);
				if (connection) {
					delete connection.instanceRecord;
				}
				return {
					...instance,
					connection,
				};
			}),
		});
	},
});
