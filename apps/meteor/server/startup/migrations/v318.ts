import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 318,
	name: 'Add OpenID Connect support and migration notice',
	async up() {
		// This migration adds a notice for users about the new OpenID Connect support
		// No automatic migration is performed to avoid breaking existing Custom OAuth configurations
		
		// Check if there are any Custom OAuth services configured
		const customOAuthServices = await Settings.find(
			{ _id: /^Accounts_OAuth_Custom-[^-]+$/ },
			{ projection: { _id: 1 } }
		).toArray();

		if (customOAuthServices.length > 0) {
			console.log('');
			console.log('='.repeat(80));
			console.log('OpenID Connect Support Added');
			console.log('='.repeat(80));
			console.log('');
			console.log('Rocket.Chat now has full OpenID Connect support!');
			console.log('');
			console.log('Benefits of OpenID Connect over Custom OAuth:');
			console.log('  • Automatic endpoint discovery');
			console.log('  • ID token support with standard claims');
			console.log('  • Single Logout (SLO) support');
			console.log('  • Better compatibility with enterprise identity providers');
			console.log('  • Works out-of-the-box with Keycloak, Entra ID, Okta, and more');
			console.log('');
			console.log('Your existing Custom OAuth configurations will continue to work.');
			console.log('');
			console.log('To migrate to OpenID Connect:');
			console.log('  1. Go to Administration → Settings → OAuth → OpenID Connect');
			console.log('  2. Configure your OpenID Connect provider');
			console.log('  3. Test the new configuration');
			console.log('  4. Disable the old Custom OAuth configuration');
			console.log('');
			console.log('For more information, see:');
			console.log('  apps/meteor/server/lib/openid/README.md');
			console.log('');
			console.log('='.repeat(80));
			console.log('');
		}
	},
});
