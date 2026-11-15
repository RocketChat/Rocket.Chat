import type { IWebdavAccount } from '@rocket.chat/core-typings';
import type { FindCursor, DeleteResult, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IWebdavAccountsModel extends IBaseModel<IWebdavAccount> {
	findOneByIdAndUserId<T extends Document = IWebdavAccount, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_id: string,
		userId: string,
		options: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByUserIdServerUrlAndUsername<
		T extends Document = IWebdavAccount,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		{
			userId,
			serverURL,
			username,
		}: {
			userId: string;
			serverURL: string;
			username: string;
		},
		options: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findWithUserId<T extends Document = IWebdavAccount, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	removeByUserAndId(_id: string, userId: string): Promise<DeleteResult>;
}
