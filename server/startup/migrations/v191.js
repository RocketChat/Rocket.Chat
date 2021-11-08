import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server';

addMigration({
	version: 191,
	up() {
		Settings.remove({ _id: /theme-color-status/ }, { multi: true });
	},
});
