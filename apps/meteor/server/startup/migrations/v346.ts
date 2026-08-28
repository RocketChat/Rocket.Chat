import { LoginServiceConfiguration, Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 346,
	name: 'Remove Drupal, Facebook, GitHub Enterprise, LinkedIn, Meteor, Twitter, WordPress and Dolphin OAuth integrations: delete their settings and login service configurations',
	async up() {
		await Settings.deleteMany({
			$or: [
				{ _id: { $regex: /^Accounts_OAuth_(Facebook|Twitter|Linkedin|Meteor|Wordpress|Drupal|Dolphin|GitHub_Enterprise)(_|$)/ } },
				{ _id: { $in: ['API_Drupal_URL', 'API_Wordpress_URL', 'API_GitHub_Enterprise_URL'] } },
			],
		});
		await LoginServiceConfiguration.deleteMany({
			service: { $in: ['facebook', 'twitter', 'linkedin', 'meteor-developer', 'wordpress', 'drupal', 'dolphin', 'github_enterprise'] },
		});
	},
});
