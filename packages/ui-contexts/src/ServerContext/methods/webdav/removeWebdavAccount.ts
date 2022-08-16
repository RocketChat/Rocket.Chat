import type { IWebdavAccount } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';

export type RemoveWebdavAccount = (accountId: IWebdavAccount['_id']) => DeleteResult;
