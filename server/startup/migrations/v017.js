import { Migrations } from 'meteor/rocketchat:migrations';
import { Messages } from 'meteor/rocketchat:models';

Migrations.add({
	version: 17,
	up() {
		return Messages.tryDropIndex({
			_hidden: 1,
		});
	},
});
