import type { IWebdavAccount, IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';

export type WebdavEndpoints = {
	'/v1/webdav.getMyAccounts': {
		GET: () => {
			accounts: IWebdavAccountIntegration[];
		};
	};
	'/v1/webdav.removeWebdavAccount': {
		POST: (params: { accountId: IWebdavAccount['_id'] }) => {
			result: DeleteResult;
		};
	};
};
