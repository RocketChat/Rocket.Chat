import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';
import { getUsersInRole } from '../../../app/authorization';

Migrations.add({
	version: 117,
	up() {
		if (Settings && getUsersInRole('admin').count()) {
			Settings.upsert(
				{
					_id: 'Show_Setup_Wizard',
				}, {
					$set: { value: 'completed' },
				}
			);
		}
	},
});
