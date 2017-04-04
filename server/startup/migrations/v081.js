RocketChat.Migrations.add({
	version: 81,
	up() {
		RocketChat.models.OAuthApps.update({ _id: 'zapier' }, {
			$set: {
				active: true,
				redirectUri: 'https://zapier.com/dashboard/auth/oauth/return/App32270API/'
			}
		});
	}
});
