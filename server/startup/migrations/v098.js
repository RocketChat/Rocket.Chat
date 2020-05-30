import { Migrations } from '../../migrations';
import { OAuthApps } from '../../../app/models';

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
