import type { IWebdavAccount, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IWebdavAccountsModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, DeleteResult, IndexDescription, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class WebdavAccountsRaw extends BaseRaw<IWebdavAccount> implements IWebdavAccountsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IWebdavAccount>>) {
		super(db, 'webdav_accounts', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { userId: 1 } }];
	}

	findOneByIdAndUserId<T extends Document = IWebdavAccount, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_id: string,
		userId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>({ _id, userId }, options);
	}

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
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>({ userId, serverURL, username }, options);
	}

	findWithUserId<T extends Document = IWebdavAccount, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = { userId };
		return this.find<T, O>(query, options);
	}

	removeByUserAndId(_id: string, userId: string): Promise<DeleteResult> {
		return this.deleteOne({ _id, userId });
	}
}
