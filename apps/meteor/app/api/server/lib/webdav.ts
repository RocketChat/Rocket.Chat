import type { IWebdavAccount } from '@rocket.chat/core-typings';

import { WebdavAccounts } from '../../../models/server/raw';

export async function findWebdavAccountsByUserId({ uid }: { uid: string }): Promise<IWebdavAccount[]> {
	return WebdavAccounts.findWithUserId(uid, {
		projection: {
			_id: 1,
			username: 1,
			serverURL: 1,
			name: 1,
		},
	}).toArray();
}
