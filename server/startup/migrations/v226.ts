import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 226,
	up() {
		return Settings.removeById('Apps_Game_Center_enabled');
	},
});
