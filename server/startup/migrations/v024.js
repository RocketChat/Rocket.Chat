import { Migrations } from 'meteor/rocketchat:migrations';
import { Permissions } from 'meteor/rocketchat:models';

Migrations.add({
	version: 24,
	up() {
		return Permissions.remove({
			_id: 'access-rocket-permissions',
		});
	},
});
