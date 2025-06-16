import { Users } from '@rocket.chat/models';

import { API } from '../../../api/server';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { isFederationEnabled } from '../lib/isFederationEnabled';
import { serverLogger } from '../lib/logger';
import { normalizers } from '../normalizers';

const userFields = { _id: 1, username: 1, type: 1, emails: 1, name: 1 };

API.v1.addRoute(
	'federation.users.search',
	{ authRequired: false },
	{
		async get() {
			/*
			The legacy federation has been deprecated for over a year
			and no longer receives any updates. This feature also has
			relevant security issues that weren't addressed.
			Workspaces should migrate to the newer matrix federation.
			*/
			apiDeprecationLogger.endpoint(this.request.route, '8.0.0', this.response, 'Use Matrix Federation instead.');

			if (!process.env.ENABLE_INSECURE_LEGACY_FEDERATION) {
				return API.v1.failure('Deprecated. ENABLE_INSECURE_LEGACY_FEDERATION environment variable is needed to enable it.');
			}

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
			/*
			The legacy federation has been deprecated for over a year
			and no longer receives any updates. This feature also has
			relevant security issues that weren't addressed.
			Workspaces should migrate to the newer matrix federation.
			*/
			apiDeprecationLogger.endpoint(this.request.route, '8.0.0', this.response, 'Use Matrix Federation instead.');

			if (!process.env.ENABLE_INSECURE_LEGACY_FEDERATION) {
				return API.v1.failure('Deprecated. ENABLE_INSECURE_LEGACY_FEDERATION environment variable is needed to enable it.');
			}

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
