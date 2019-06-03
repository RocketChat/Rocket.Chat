import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

// Enable iframe usage for existant RC installations.
Migrations.add({
	version: 148,
	up() {
		Settings.upsert({ _id: 'Iframe_Restrict_Access' }, {
			$set: {
				value: false,
			},
		});
	},
});
