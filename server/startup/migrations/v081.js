import { Migrations } from 'meteor/rocketchat:migrations';
import { OAuthApps } from 'meteor/rocketchat:models';

Migrations.add({
	version: 81,
	up() {
		OAuthApps.update({ _id: 'zapier' }, {
			$set: {
				active: true,
				redirectUri: 'https://zapier.com/dashboard/auth/oauth/return/App32270API/',
			},
		});
	},
});
