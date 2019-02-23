import { Migrations } from 'meteor/rocketchat:migrations';
import { Messages } from 'meteor/rocketchat:models';

Migrations.add({
	version: 16,
	up() {
		return Messages.tryDropIndex({
			_hidden: 1,
		});
	},
});
