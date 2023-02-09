import { addMigration } from '../../lib/migrations';
import { settingsRegenerator } from '../../lib/settingsRegenerator';

// Removes invalid settings from DB one time
addMigration({
	version: 284,
	async up() {
		await settingsRegenerator();
	},
});
