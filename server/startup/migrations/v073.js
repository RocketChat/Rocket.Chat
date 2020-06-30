import { Migrations } from '../../../app/migrations';
import { Users } from '../../../app/models';

Migrations.add({
	version: 73,
	up() {
		Users.find({ 'oauth.athorizedClients': { $exists: true } }, { oauth: 1 }).forEach(function(user) {
			Users.update({ _id: user._id }, {
				$set: {
					'oauth.authorizedClients': user.oauth.athorizedClients,
				},
				$unset: {
					'oauth.athorizedClients': 1,
				},
			});
		});
	},
});
