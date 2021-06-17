import { BaseRaw } from './BaseRaw';

export class WebdavAccountsRaw extends BaseRaw {
	findWithUserId(user_id, options) {
		const query = { user_id };
		return this.find(query, options);
	}
}
