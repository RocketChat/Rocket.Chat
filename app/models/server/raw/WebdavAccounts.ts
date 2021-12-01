/* eslint-disable @typescript-eslint/camelcase */
/**
 * Webdav Accounts model
 */
import type { Collection, FindOneOptions, Cursor, DeleteWriteOpResultObject } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IWebdavAccount } from '../../../../definition/IWebdavAccount';

type T = IWebdavAccount;

export class WebdavAccountsRaw extends BaseRaw<T> {
	constructor(
		public readonly col: Collection<T>,
		trash?: Collection<T>,
	) {
		super(col, trash);

		this.col.createIndex({ user_id: 1 });
	}

	findOneByIdAndUserId(_id: string, user_id: string, options: FindOneOptions<T>): Promise<T | null> {
		return this.findOne({ _id, user_id }, options);
	}

	findOneByUserIdServerUrlAndUsername({
		user_id,
		server_url,
		username,
	}: {
		user_id: string;
		server_url: string;
		username: string;
	}, options: FindOneOptions<T>): Promise<T | null> {
		return this.findOne({ user_id, server_url, username }, options);
	}

	findWithUserId(user_id: string, options: FindOneOptions<T>): Cursor<T> {
		const query = { user_id };
		return this.find(query, options);
	}

	removeByUserAndId(_id: string, user_id: string): Promise<DeleteWriteOpResultObject> {
		return this.deleteOne({ _id, user_id });
	}
}
