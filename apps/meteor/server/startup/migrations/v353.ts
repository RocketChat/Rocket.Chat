import { LoginServiceConfiguration } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';
import { settings } from '../../settings';

addMigration({
	version: 353,
	name: 'Remove the login services left behind by the removed OAuth providers and the modern flow toggle',
	async up() {
		settings
			.getByRegexp(/^Accounts_OAuth_(Facebook|Twitter|Linkedin|Meteor|Wordpress|Drupal|Dolphin|GitHub_Enterprise|Use_Modern_Flow)$/)
			.forEach(([_id]) => {
				const setting = settings.getSetting(_id);
				if (setting) {
					settings.set({ ...setting, value: undefined });
				}
			});

		await LoginServiceConfiguration.deleteMany({
			service: {
				$in: ['facebook', 'twitter', 'linkedin', 'meteor', 'wordpress', 'drupal', 'dolphin', 'github_enterprise', 'use_modern_flow'],
			},
			custom: { $ne: true },
		});
	},
});
