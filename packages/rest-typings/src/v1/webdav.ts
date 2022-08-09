import type { IWebdavAccountIntegration } from '@rocket.chat/core-typings';

export type WebdavEndpoints = {
	'/v1/webdav.getMyAccounts': {
		GET: () => {
			accounts: IWebdavAccountIntegration[];
		};
	};
};
