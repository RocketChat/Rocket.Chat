import { WebdavAccounts } from '../../../models/server/raw';
import { IWebdavAccount } from '../../../../definition/IWebdavAccount';

export async function findWebdavAccountsByUserId({ uid }: { uid: string }): Promise<{ accounts: IWebdavAccount[] }> {
	return {
		accounts: await WebdavAccounts.findWithUserId(uid, {
			projection: {
				_id: 1,
				username: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				server_url: 1,
				name: 1,
			},
		}).toArray(),
	};
}
