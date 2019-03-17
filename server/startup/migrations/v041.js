import { Migrations } from '../../../app/migrations';
import { Users } from '../../../app/models';

Migrations.add({
	version: 41,
	up() {
		if (Users) {
			Users.update({ bot: true }, { $set: { type: 'bot' } }, { multi: true });
			Users.update({ 'profile.guest': true }, { $set: { type: 'visitor' } }, { multi: true });
			Users.update({ type: { $exists: false } }, { $set: { type: 'user' } }, { multi: true });
		}
	},
});
