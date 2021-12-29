import { WebdavAccounts } from '../../../models/server/raw';
import { IWebdavAccount } from '../../../../definition/IWebdavAccount';

export async function findWebdavAccountsByUserId({ uid }: { uid: string }): Promise<{ accounts: IWebdavAccount[] }> {
	return {
		accounts: await WebdavAccounts.findWithUserId(uid, {
			projection: {
				_id: 1,
				username: 1,
				serverURL: 1,
				name: 1,
			},
		}).toArray(),
	};
}
