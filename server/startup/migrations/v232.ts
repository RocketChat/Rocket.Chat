import { Settings, Rooms } from '../../../app/models/server';
import { Migrations } from '../../../app/migrations';

Migrations.add({
	version: 232,
	up() {
		if (Settings.findOneById('Show_Setup_Wizard') === 'pending' && !Rooms.findOneById('GENERAL')) {
			Rooms.createWithIdTypeAndName('GENERAL', 'c', 'general', {
				default: true,
			});
		}
	},
});
