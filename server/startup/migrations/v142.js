import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 142,
	up() {
		Settings.remove({ _id: 'Force_Disable_OpLog_For_Cache' });
	},
});
