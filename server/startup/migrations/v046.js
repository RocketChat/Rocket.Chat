import { Migrations } from '../../../app/migrations';
import { Users } from '../../../app/models';

Migrations.add({
	version: 46,
	up() {
		if (Users) {
			Users.update({ type: { $exists: false } }, { $set: { type: 'user' } }, { multi: true });
		}
	},
});
