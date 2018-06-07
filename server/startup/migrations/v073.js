RocketChat.Migrations.add({
	version: 73,
	up() {
		RocketChat.models.Users.find({ 'oauth.athorizedClients': { $exists: true } }, { oauth: 1 }).forEach(function(user) {
			RocketChat.models.Users.update({ _id: user._id }, {
				$set: {
					'oauth.authorizedClients': user.oauth.athorizedClients
				},
				$unset: {
					'oauth.athorizedClients': 1
				}
			});
		});
	}
});
