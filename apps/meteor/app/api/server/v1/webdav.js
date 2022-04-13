import { API } from '../api';
import { findWebdavAccountsByUserId } from '../lib/webdav';

API.v1.addRoute(
	'webdav.getMyAccounts',
	{ authRequired: true },
	{
		get() {
			return API.v1.success(Promise.await(findWebdavAccountsByUserId({ uid: this.userId })));
		},
	},
);
