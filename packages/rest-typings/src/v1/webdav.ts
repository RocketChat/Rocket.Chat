import type { IWebdavAccount } from '@rocket.chat/core-typings';

export type WebdavEndpoints = {
	'/v1/webdav.getMyAccounts': {
		GET: () => {
			accounts: Pick<IWebdavAccount, '_id' | 'username' | 'serverURL' | 'name'>[];
		};
	};
};
