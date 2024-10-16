import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

// Removes deprecated Show Message In Main Thread preference
addMigration({
	version: 314,
	async up() {
		const customOauthServicesButtonColors = await Settings.find(
			{ _id: /Accounts_OAuth_.+button.+color$/ },
			{ projection: { _id: 1 } },
		).toArray();

		for await (const setting of customOauthServicesButtonColors) {
			await Settings.removeById(setting._id);
		}
	},
});
