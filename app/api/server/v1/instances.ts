import { getInstances } from '../../../../server/stream/streamBroadcast';
import { hasPermission } from '../../../authorization/server';
import { API } from '../api';

API.v1.addRoute('instances.get', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-statistics')) {
			return API.v1.unauthorized();
		}

		return API.v1.success({ instances: getInstances() });
	},
});
