import { Migrations } from '/app/migrations';
import { Messages } from '/app/models';

Migrations.add({
	version: 16,
	up() {
		return Messages.tryDropIndex({
			_hidden: 1,
		});
	},
});
