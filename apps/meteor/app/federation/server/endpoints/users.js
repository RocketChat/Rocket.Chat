import { Users } from '@rocket.chat/models';

import { API } from '../../../api/server';
import { isFederationEnabled } from '../lib/isFederationEnabled';
import { serverLogger } from '../lib/logger';
import { normalizers } from '../normalizers';

const userFields = { _id: 1, username: 1, type: 1, emails: 1, name: 1 };

API.v1.addRoute(
	'federation.users.search',
	{ authRequired: false },
	{
		async get() {
			if (!isFederationEnabled()) {
				return API.v1.failure('Federation not enabled');
			}

			const { username, domain } = this.queryParams;

			serverLogger.debug(`federation.users.search => username=${username} domain=${domain}`);

			const query = {
				type: 'user',
				$or: [{ name: username }, { username }, { 'emails.address': `${username}@${domain}` }],
			};

			let users = await Users.find(query, { projection: userFields }).toArray();

			users = await normalizers.normalizeAllUsers(users);

			return API.v1.success({ users });
		},
	},
);

API.v1.addRoute(
	'federation.users.getByUsername',
	{ authRequired: false },
	{
		async get() {
			if (!isFederationEnabled()) {
				return API.v1.failure('Federation not enabled');
			}

			const { username } = this.queryParams;

			serverLogger.debug(`federation.users.getByUsername => username=${username}`);

			const query = {
				type: 'user',
				username,
			};

			let user = await Users.findOne(query, { projection: userFields });

			user = await normalizers.normalizeUser(user);

			return API.v1.success({ user });
		},
	},
);
