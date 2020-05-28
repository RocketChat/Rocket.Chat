import { Migrations } from '../../../app/migrations';
import { Users } from '../../../app/models';

Migrations.add({
	version: 13,
	up() {
		// Set all current users as active
		Users.setAllUsersActive(true);
		return console.log('Set all users as active');
	},
});
