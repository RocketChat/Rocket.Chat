import { API } from '../api';
import { getServerInfo } from '../lib/getServerInfo';

API.default.addRoute(
	'info',
	{ authRequired: false },
	{
		async get() {
			return API.v1.success(await getServerInfo(this.userId));
		},
	},
);
