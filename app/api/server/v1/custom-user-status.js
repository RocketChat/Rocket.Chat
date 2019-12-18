import { API } from '../api';
import { findCustomUserStatus } from '../lib/custom-user-status';

API.v1.addRoute('custom-user-status.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findCustomUserStatus({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});
