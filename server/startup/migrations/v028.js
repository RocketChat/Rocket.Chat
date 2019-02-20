import { Migrations } from 'meteor/rocketchat:migrations';
import { Permissions } from 'meteor/rocketchat:models';

Migrations.add({
	version: 28,
	up() {
		return Permissions.addRole('view-c-room', 'bot');
	},
});
