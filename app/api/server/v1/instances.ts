import { getInstances } from '../../../../server/stream/streamBroadcast';
import * as api from '../api';

interface IAPIRouter {
	v1: api.APIClass;
}

const API = api.API as IAPIRouter;

API.v1.addRoute('instances.get', { authRequired: true }, {
	get() {
		try {
			return API.v1.success({ instances: getInstances() });
		} catch (e) {
			return API.v1.failure(e, null, null, null);
		}
	},
});
