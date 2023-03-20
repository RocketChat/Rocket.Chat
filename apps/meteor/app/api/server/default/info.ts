import { API } from '../api';
import { getLoggedInUser } from '../helpers/getLoggedInUser';
import { getServerInfo } from '../lib/getServerInfo';

API.default.addRoute(
	'info',
	{ authRequired: false },
	{
		async get() {
			const request = this.request as Record<string, any>;
			const user = await getLoggedInUser(request.headers['x-auth-token'] as string, request.headers['x-user-id'] as string);

			return API.v1.success(Promise.await(getServerInfo(user?._id)));
		},
	},
);

API.default.addRoute(
	'ecdh_proxy/initEncryptedSession',
	{ authRequired: false },
	{
		post() {
			return {
				statusCode: 200,
				body: {
					success: false,
					error: 'Not Acceptable',
				},
			};
		},
	},
);
