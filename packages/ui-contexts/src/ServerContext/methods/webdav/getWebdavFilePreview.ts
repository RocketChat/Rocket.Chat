import type { IWebdavAccount } from '@rocket.chat/core-typings';

export type GetWebdavFilePreview = (accountId: IWebdavAccount['_id'], path: string) => { success: true; data: Uint8Array };
