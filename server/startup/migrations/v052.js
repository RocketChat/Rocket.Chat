import { Migrations } from 'meteor/rocketchat:migrations';
import { Users } from 'meteor/rocketchat:models';

Migrations.add({
	version: 52,
	up() {
		Users.update({ _id: 'rocket.cat' }, { $addToSet: { roles: 'bot' } });
	},
});
