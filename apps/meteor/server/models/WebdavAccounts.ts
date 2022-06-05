import type { FindOneOptions, Cursor, DeleteWriteOpResultObject, IndexSpecification } from 'mongodb';
import type { IWebdavAccount } from '@rocket.chat/core-typings';
import type { IWebdavAccountsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class WebdavAccounts extends ModelClass<IWebdavAccount> implements IWebdavAccountsModel {
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

const col = db.collection(`${prefix}webdav_accounts`);
registerModel('IWebdavAccountsModel', new WebdavAccounts(col, trashCollection) as IWebdavAccountsModel);
