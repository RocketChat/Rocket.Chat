import { Migrations } from 'meteor/rocketchat:migrations';
import { Messages } from 'meteor/rocketchat:models';

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
