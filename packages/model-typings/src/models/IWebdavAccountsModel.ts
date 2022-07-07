import type { FindOptions, FindCursor, DeleteResult } from 'mongodb';
import type { IWebdavAccount } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IWebdavAccountsModel extends IBaseModel<IWebdavAccount> {
	findOneByIdAndUserId(_id: string, userId: string, options: FindOptions<IWebdavAccount>): Promise<IWebdavAccount | null>;
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
		options: FindOptions<IWebdavAccount>,
	): Promise<IWebdavAccount | null>;

	findWithUserId(userId: string, options: FindOptions<IWebdavAccount>): FindCursor<IWebdavAccount>;

	removeByUserAndId(_id: string, userId: string): Promise<DeleteResult>;
}
