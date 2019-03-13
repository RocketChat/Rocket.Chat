import { Migrations } from '/app/migrations';
import { Messages } from '/app/models';

Migrations.add({
	version: 26,
	up() {
		return Messages.update({
			t: 'rm',
		}, {
			$set: {
				mentions: [],
			},
		}, {
			multi: true,
		});
	},
});
