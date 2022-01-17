import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 233,
	up() {
		return Settings.deleteMany({ _id: { $in: ['Log_Package', 'Log_File'] } });
	},
});
