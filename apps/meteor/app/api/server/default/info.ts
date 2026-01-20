import { API } from '../api';
import { getLoggedInUser } from '../helpers/getLoggedInUser';
import { getServerInfo } from '../lib/getServerInfo';

API.default.addRoute(
	'info',
	{ authRequired: false },
	{
		async get() {
			const user = await getLoggedInUser(this.request);
			return API.v1.success(await getServerInfo(user?._id));
		},
	},
);
