import { Migrations } from '../../../app/migrations';
import { Users } from '../../../app/models';

Migrations.add({
	version: 52,
	up() {
		Users.update({ _id: 'genius' }, { $addToSet: { roles: 'bot' } });
	},
});
