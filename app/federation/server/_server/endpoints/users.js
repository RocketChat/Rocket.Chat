import { API } from '../../../../api';
import { Users } from '../../../../models';
import { Federation } from '../..';
import { normalizers } from '../../normalizers';
import { logger } from '../../logger';

const userFields = { _id: 1, username: 1, type: 1, emails: 1, name: 1 };

API.v1.addRoute('federation.users.search', { authRequired: false }, {
	get() {
		if (!Federation.enabled) {
			return API.v1.failure('Not found');
		}

		const { username, domain } = this.requestParams();

		logger.server.debug(`federation.users.search => username=${ username } domain=${ domain }`);

		const query = {
			type: 'user',
			$or: [
				{ name: username },
				{ username },
				{ 'emails.address': `${ username }@${ domain }` },
			],
		};

		let users = Users.find(query, { fields: userFields }).fetch();

		users = normalizers.normalizeAllUsers(users);

		return API.v1.success({ users });
	},
});

API.v1.addRoute('federation.users.getByUsername', { authRequired: false }, {
	get() {
		if (!Federation.enabled) {
			return API.v1.failure('Not found');
		}

		const { username } = this.requestParams();

		logger.server.debug(`federation.users.getByUsername => username=${ username }`);

		const query = {
			type: 'user',
			username,
		};

		let user = Users.findOne(query, { fields: userFields });

		user = normalizers.normalizeUser(user);

		return API.v1.success({ user });
	},
});
