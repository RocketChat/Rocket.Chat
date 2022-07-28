import type { IWebdavAccount } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';

export type WebdavEndpoints = {
	'/v1/webdav.getMyAccounts': {
		GET: () => {
			accounts: Pick<IWebdavAccount, '_id' | 'username' | 'serverURL' | 'name'>[];
		};
	};
	'/v1/webdav.removeWebdavAccount': {
		POST: (params: { accountId: IWebdavAccount['_id'] }) => {
			// success: boolean;
			result: DeleteResult;
		};
	};
};
