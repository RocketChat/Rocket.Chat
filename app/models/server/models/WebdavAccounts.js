/**
 * Webdav Accounts model
 */
import { Base } from './_Base';

export class WebdavAccounts extends Base {
	constructor() {
		super('webdav_accounts');

		this.tryEnsureIndex({ user_id: 1 });
	}

	findWithUserId(user_id, options) {
		const query = { user_id };
		return this.find(query, options);
	}

	removeByUserAndId(_id, user_id) {
		return this.remove({ _id, user_id });
	}

	removeById(_id) {
		return this.remove({ _id });
	}
}

export default new WebdavAccounts();
