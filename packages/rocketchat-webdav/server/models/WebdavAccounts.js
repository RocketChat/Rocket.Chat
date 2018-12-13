/**
 * Webdav Accounts model
 */
import { RocketChat } from 'meteor/rocketchat:lib';

class WebdavAccounts extends RocketChat.models._Base {
	constructor() {
		super('webdav_accounts');

		this.tryEnsureIndex({ user_id: 1, server_url: 1, username: 1, name: 1 }, { unique: 1 });
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

RocketChat.models.WebdavAccounts = new WebdavAccounts();
