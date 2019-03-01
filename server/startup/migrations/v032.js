import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 32,
	up() {
		return Settings.update({
			_id: /Accounts_OAuth_Custom_/,
		}, {
			$set: {
				group: 'OAuth',
			},
		}, {
			multi: true,
		});
	},
});
