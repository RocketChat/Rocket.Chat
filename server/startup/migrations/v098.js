RocketChat.Migrations.add({
	version: 98,
	up() {
		RocketChat.models.OAuthApps.update({ _id: 'zapier' }, {
			$set: {
				redirectUri: 'https://zapier.com/dashboard/auth/oauth/return/RocketChatDevAPI/'
			}
		});
	}
});
