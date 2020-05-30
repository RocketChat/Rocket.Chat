import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models';

// Enable iframe usage for existant RC installations.
Migrations.add({
	version: 164,
	up() {
		Settings.upsert({ _id: 'Iframe_Restrict_Access' }, {
			$set: {
				value: false,
			},
		});
	},
});
