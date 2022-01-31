import type { WebdavAccountIntegration } from '@rocket.chat/core-typings';

export type WebdavEndpoints = {
	'/v1/webdav.getMyAccounts': {
		GET: () => {
			accounts: WebdavAccountIntegration[];
		};
	};
};
