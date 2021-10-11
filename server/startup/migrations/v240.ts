import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server';

addMigration({
	version: 240,
	up() {
		Settings.removeById('Support_Cordova_App');
	},
});
