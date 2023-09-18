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
