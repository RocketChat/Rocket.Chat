import type { IWebdavAccount, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IWebdavAccountsModel } from '@rocket.chat/model-typings';
import type { Collection, Cursor, Db, DeleteWriteOpResultObject, FindOneOptions, IndexSpecification } from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class WebdavAccountsRaw extends BaseRaw<IWebdavAccount> implements IWebdavAccountsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IWebdavAccount>>) {
		super(db, getCollectionName('webdav_accounts'), trash);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { userId: 1 } }];
	}

	findOneByIdAndUserId(_id: string, userId: string, options: FindOneOptions<IWebdavAccount>): Promise<IWebdavAccount | null> {
		return this.findOne({ _id, userId }, options);
	}

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
	): Promise<IWebdavAccount | null> {
		return this.findOne({ userId, serverURL, username }, options);
	}

	findWithUserId(userId: string, options: FindOneOptions<IWebdavAccount>): Cursor<IWebdavAccount> {
		const query = { userId };
		return this.find(query, options);
	}

	removeByUserAndId(_id: string, userId: string): Promise<DeleteWriteOpResultObject> {
		return this.deleteOne({ _id, userId });
	}
}
