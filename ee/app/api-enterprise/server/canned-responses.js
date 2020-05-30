import { API } from '../../../../server/api';
import { findAllCannedResponses } from './lib/canned-responses';

API.v1.addRoute('canned-responses.get', { authRequired: true }, {
	get() {
		return API.v1.success({
			responses: Promise.await(findAllCannedResponses({ userId: this.userId })),
		});
	},
});
