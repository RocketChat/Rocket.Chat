import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models';

addMigration({
	version: 207,
	up() {
		Settings.removeById('theme-color-tertiary-background-color');
	},
});
