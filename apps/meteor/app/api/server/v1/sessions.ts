import { Sessions } from '../../../models/server/raw/index';
import { API } from '../api';

API.v1.addRoute(
	'sessions.list',
	{ authRequired: true },
	{
		async get() {
			try {
				const { offset, count } = this.getPaginationItems();
				const { search } = this.queryParams;
				const sessions = await Sessions.getByUserId(this.userId, search, { offset, count });
				return API.v1.success(sessions);
			} catch (error) {
				return API.v1.failure(error);
			}
		},
	},
);

