import { API } from '../api';
import { findWebdavAccountsByUserId } from '../lib/webdav';

API.v1.addRoute(
	'webdav.getMyAccounts',
	{ authRequired: true },
	{
		async get() {
			return API.v1.success({
				accounts: await findWebdavAccountsByUserId({ uid: this.userId }),
			});
		},
	},
);
