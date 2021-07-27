import {
	Migrations,
} from '../../../app/migrations';
import {
	Settings,
} from '../../../app/models';


Migrations.add({
	version: 176,
	up() {
		Settings.remove({ _id: 'Livechat', type: 'group' });
	},
});
