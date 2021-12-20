import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 191,
	async up() {
		return Settings.deleteMany({ _id: /theme-color-status/ });
	},
});
