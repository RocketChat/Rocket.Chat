import { Migrations } from '../../../app/migrations';
import { Permissions } from '../../../app/models';

Migrations.add({
	version: 78,
	up() {
		Permissions.update({ _id: { $in: ['create-c', 'create-d', 'create-p'] } }, { $addToSet: { roles: 'bot' } }, { multi: true });
	},
});
