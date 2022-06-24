import type { FindOneOptions, Cursor, DeleteWriteOpResultObject } from 'mongodb';
import type { IWebdavAccount } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IWebdavAccountsModel extends IBaseModel<IWebdavAccount> {
	findOneByIdAndUserId(_id: string, userId: string, options: FindOneOptions<IWebdavAccount>): Promise<IWebdavAccount | null>;
	findOneByUserIdServerUrlAndUsername(
		{
			userId,
			serverURL,
			username,
		}: {
			userId: string;
			serverURL: string;
			username: string;
		},
		options: FindOneOptions<IWebdavAccount>,
	): Promise<IWebdavAccount | null>;

	findWithUserId(userId: string, options: FindOneOptions<IWebdavAccount>): Cursor<IWebdavAccount>;

	removeByUserAndId(_id: string, userId: string): Promise<DeleteWriteOpResultObject>;
}
