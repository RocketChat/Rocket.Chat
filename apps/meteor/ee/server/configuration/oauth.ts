import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';

import { callbacks } from '../../../server/lib/callbacks';
import { settings } from '../../../server/settings';
import { OAuthEEManager, syncOAuthUserRoles } from '../lib/oauth/Manager';
import { createOAuthCallbacks } from './oauthCallbacks';

const logger = new Logger('EECustomOAuth');

await License.onLicense('oauth-enterprise', () => {
	const oauthCallbacks = createOAuthCallbacks({
		settings,
		oAuthEEManager: OAuthEEManager,
		syncOAuthUserRoles,
		logger,
	});

	callbacks.add('afterProcessOAuthUser', oauthCallbacks.afterProcessOAuthUser);
	callbacks.add('afterValidateNewOAuthUser', oauthCallbacks.afterValidateNewOAuthUser);
});
