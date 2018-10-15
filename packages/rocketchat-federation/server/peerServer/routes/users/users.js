import express from 'express';
import FederationUser from '../../../federatedResources/FederatedUser';

const router = express.Router(); /* eslint-disable-line new-cap */

export default function usersRoutes(app) {
	const self = this;

	app.use('/users', router);

	router.get('/', async function(req, res) {
		const { identifier: localPeerIdentifier } = self.config;

		const {
			query: { username, email },
		} = req;

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
			return res.sendStatus(404);
		}

		const federatedUser = new FederationUser(localPeerIdentifier, user);

		res.send({ federatedUser });
	});
}
