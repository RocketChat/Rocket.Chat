import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';
import { getUsersInRole } from 'meteor/rocketchat:authorization';

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
