import type { IWebdavAccount, IWebdavNode } from '@rocket.chat/core-typings';

export type GetFileFromWebdav = (accountId: IWebdavAccount['_id'], file: IWebdavNode) => { success: boolean; data: Uint8Array };
