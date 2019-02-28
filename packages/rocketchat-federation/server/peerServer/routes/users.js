import { API } from 'meteor/rocketchat:api';
import { Users } from 'meteor/rocketchat:models';

import FederationUser from '../../federatedResources/FederatedUser';
import peerServer from '../peerServer';

API.v1.addRoute('federation.users', { authRequired: false }, {
	get() {
		if (!peerServer.enabled) {
			return API.v1.failure('Not found');
		}

		const { peer: { domain: localPeerDomain } } = self.config;

		const { username, domain, emailOnly } = this.requestParams();

		const email = `${ username }@${ domain }`;

		self.log(`[users] Trying to find user by username:${ username } and email:${ email }`);

		const query = {
			type: 'user',
		};

		if (emailOnly === 'true') {
			query['emails.address'] = email;
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
			federatedUsers.push(new FederationUser(localPeerDomain, user));
		}

		return API.v1.success({ federatedUsers });
	},
});
