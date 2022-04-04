import { API } from '../../../api/server';
import { Users } from '../../../models/server';
import { normalizers } from '../normalizers';
import { serverLogger } from '../lib/logger';
import { isFederationEnabled } from '../lib/isFederationEnabled';

const userFields = { _id: 1, username: 1, type: 1, emails: 1, name: 1 };

API.v1.addRoute(
	'federation.users.search',
	{ authRequired: false },
	{
		get() {
			if (!isFederationEnabled()) {
				return API.v1.failure('Federation not enabled');
			}

			const { username, domain } = this.requestParams();

			serverLogger.debug(`federation.users.search => username=${username} domain=${domain}`);

			const query = {
				type: 'user',
				$or: [{ name: username }, { username }, { 'emails.address': `${username}@${domain}` }],
			};

			let users = Users.find(query, { fields: userFields }).fetch();

			users = normalizers.normalizeAllUsers(users);

			return API.v1.success({ users });
		},
	},
);

API.v1.addRoute(
	'federation.users.getByUsername',
	{ authRequired: false },
	{
		get() {
			if (!isFederationEnabled()) {
				return API.v1.failure('Federation not enabled');
			}

			const { username } = this.requestParams();

			serverLogger.debug(`federation.users.getByUsername => username=${username}`);

			const query = {
				type: 'user',
				username,
			};

			let user = Users.findOne(query, { fields: userFields });

			user = normalizers.normalizeUser(user);

			return API.v1.success({ user });
		},
	},
);
