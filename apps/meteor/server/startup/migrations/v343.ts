import { LoginServiceConfiguration, Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 343,
	name: 'Remove Apple, Drupal, Facebook, LinkedIn, Meteor, Nextcloud, Twitter, WordPress and Dolphin OAuth integrations: delete their settings and login service configurations',
	async up() {
		await Settings.deleteMany({
			$or: [
				{ _id: { $regex: /^Accounts_OAuth_(Apple|Facebook|Twitter|Linkedin|Meteor|Wordpress|Drupal|Dolphin|Nextcloud)(_|$)/ } },
				{ _id: { $in: ['API_Drupal_URL', 'API_Wordpress_URL'] } },
			],
		});
		await LoginServiceConfiguration.deleteMany({
			service: { $in: ['apple', 'facebook', 'twitter', 'linkedin', 'meteor-developer', 'wordpress', 'drupal', 'dolphin', 'nextcloud'] },
		});
	},
});
