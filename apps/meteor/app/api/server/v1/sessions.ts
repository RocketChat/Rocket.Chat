import { Sessions } from '../../../models/server/raw/index';
import { API } from '../api';

API.v1.addRoute(
	'sessions.list',
	{ authRequired: true },
	{
		async get() {
			try {
				const { limit, page, search } = this.queryParams;
				const sessions = await Sessions.getByUserId({ userId: this.userId, limit, page, search });
				return API.v1.success(sessions);
			} catch (error) {
				return API.v1.failure(error);
			}
		},
	},
);

