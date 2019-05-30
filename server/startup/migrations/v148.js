import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 148,
	up() {
		Settings.upsert({ _id: 'Allow_Loading_In_Iframe' }, {
			$set: {
				value: true,
			},
		});
	},
});
