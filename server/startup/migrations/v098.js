import { Migrations } from 'meteor/rocketchat:migrations';
import { OAuthApps } from 'meteor/rocketchat:models';

Migrations.add({
	version: 98,
	up() {
		OAuthApps.update({ _id: 'zapier' }, {
			$set: {
				redirectUri: 'https://zapier.com/dashboard/auth/oauth/return/RocketChatDevAPI/',
			},
		});
	},
});
