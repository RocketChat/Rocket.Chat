import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 321,
	name: 'Remove voxtelesys & mobex related settings',
	async up() {
		await Promise.all([Settings.deleteMany({ section: { $in: ['Voxtelesys', 'Mobex'] } })]);
	},
});
