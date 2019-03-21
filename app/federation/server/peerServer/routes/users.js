import { API } from '../../../../api';
import { Users } from '../../../../models';

import { FederatedUser } from '../../federatedResources';
import peerServer from '../peerServer';

API.v1.addRoute('federation.users', { authRequired: false }, {
	get() {
		if (!peerServer.enabled) {
			return API.v1.failure('Not found');
		}

		const { peer: { domain: localPeerDomain } } = peerServer.config;

		const { username, domain, usernameOnly } = this.requestParams();

		const email = `${ username }@${ domain }`;

		peerServer.log(`[users] Trying to find user by username:${ username } and email:${ email }`);

		const query = {
			type: 'user',
		};

		if (usernameOnly === 'true') {
			query.username = username;
		} else {
			query.$or = [
				{ name: username },
				{ username },
				{ 'emails.address': email },
			];
		}

		const users = Users.find(query, { fields: { services: 0, roles: 0 } }).fetch();

		if (!users.length) {
			return API.v1.failure('There is no such user in this server');
		}

		const federatedUsers = [];

		for (const user of users) {
			federatedUsers.push(new FederatedUser(localPeerDomain, user));
		}

		return API.v1.success({ federatedUsers });
	},
});
