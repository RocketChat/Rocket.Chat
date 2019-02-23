import { Migrations } from 'meteor/rocketchat:migrations';
import { Users } from 'meteor/rocketchat:models';

Migrations.add({
	version: 46,
	up() {
		if (Users) {
			Users.update({ type: { $exists: false } }, { $set: { type: 'user' } }, { multi: true });
		}
	},
});
