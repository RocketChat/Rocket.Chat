import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 62,
	up() {
		Settings.remove({ _id: 'Atlassian Crowd', type: 'group' });
	},
});
