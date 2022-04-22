import type { IWebdavAccountPayload } from "@rocket.chat/core-typings";

export type WebdavEndpoints = {
	'webdav.getMyAccounts': {
		GET: () => {
			accounts: IWebdavAccountPayload[];
		};
	};
};
