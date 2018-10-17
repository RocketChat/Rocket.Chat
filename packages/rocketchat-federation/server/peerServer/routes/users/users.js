import FederationUser from '../../../federatedResources/FederatedUser';

export default function usersRoutes() {
	const self = this;

	RocketChat.API.v1.addRoute('federation.users', { authRequired: false }, {
		get() {
			const { identifier: localPeerIdentifier } = self.config;

			const { username, email } = this.requestParams();

			const options = { fields: { services: 0, roles: 0 } };

			let user = null;

			if (username) {
				self.log(`[users] Trying to find user:${ username }`);

				user = RocketChat.models.Users.findOneByUsername(username, options);
			} else {
				self.log(`[users] Trying to find user:${ email }`);

				user = RocketChat.models.Users.findOneByEmailAddress(email, options);
			}

			if (!user) {
				return RocketChat.API.v1.failure('There is no such user in this server');
			}

			const federatedUser = new FederationUser(localPeerIdentifier, user);

			return RocketChat.API.v1.success({ federatedUser });
		},
	});
}
