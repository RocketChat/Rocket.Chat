import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server';

addMigration({
	version: 233,
	up() {
		Settings.remove({ _id: { $in: [
			'Log_Package',
			'Log_File',
		] } });
	},
});
