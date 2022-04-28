import type { IWebdavAccount } from '@rocket.chat/core-typings';

export type WebdavEndpoints = {
   'webdav.getMyAccounts': {
      GET: (params: { uid: string }) => {
         accounts: IWebdavAccount[];
      };
   };
};