import { Migrations } from '../../../app/migrations';
import { Settings } from '../../models';

Migrations.add({
	version: 226,
	up() {
		Settings.removeById('Apps_Game_Center_enabled');
	},
});
