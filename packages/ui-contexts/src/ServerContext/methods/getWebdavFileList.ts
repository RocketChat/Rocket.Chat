import type { IWebdavAccount } from '@rocket.chat/core-typings';

export type GetWebdavFileListMethod = (accountId: IWebdavAccount['_id'], path: string) => { success: boolean; data: any };
