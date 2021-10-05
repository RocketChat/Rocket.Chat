import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server';

addMigration({
	version: 226,
	up() {
		Settings.removeById('Apps_Game_Center_enabled');
	},
});
