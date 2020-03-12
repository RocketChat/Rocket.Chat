import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

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
