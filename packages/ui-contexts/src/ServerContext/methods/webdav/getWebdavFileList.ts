import type { IWebdavAccount, IWebdavNode } from '@rocket.chat/core-typings';

export type GetWebdavFileList = (accountId: IWebdavAccount['_id'], path: string) => { success: boolean; data: IWebdavNode[] };
