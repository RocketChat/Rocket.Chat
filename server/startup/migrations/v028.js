import { Migrations } from '/app/migrations';
import { Permissions } from '/app/models';

Migrations.add({
	version: 28,
	up() {
		return Permissions.addRole('view-c-room', 'bot');
	},
});
