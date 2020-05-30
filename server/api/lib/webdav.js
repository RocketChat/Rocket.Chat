import { WebdavAccounts } from '../../../app/models/server/raw';

export async function findWebdavAccountsByUserId({ uid }) {
	return {
		accounts: await WebdavAccounts.findWithUserId(uid, {
			fields: {
				_id: 1,
				username: 1,
				server_url: 1,
				name: 1,
			},
		}).toArray(),
	};
}
