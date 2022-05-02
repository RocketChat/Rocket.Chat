/**
 * Webdav Accounts model
 */
import type { FindOneOptions, Cursor, DeleteWriteOpResultObject } from 'mongodb';
import type { IWebdavAccount } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

type T = IWebdavAccount;

export class WebdavAccountsRaw extends BaseRaw<T> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { userId: 1 } }];
	}

	findOneByIdAndUserId(_id: string, userId: string, options: FindOneOptions<T>): Promise<T | null> {
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
		options: FindOneOptions<T>,
	): Promise<T | null> {
		return this.findOne({ userId, serverURL, username }, options);
	}

	findWithUserId(userId: string, options: FindOneOptions<T>): Cursor<T> {
		const query = { userId };
		return this.find(query, options);
	}

	removeByUserAndId(_id: string, userId: string): Promise<DeleteWriteOpResultObject> {
		return this.deleteOne({ _id, userId });
	}
}
