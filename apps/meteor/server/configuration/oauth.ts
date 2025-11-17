import debounce from 'lodash.debounce';

import type { ICachedSettings } from '../../app/settings/server/CachedSettings';
import { initCustomOAuthServices } from '../lib/oauth/initCustomOAuthServices';
import { removeOAuthService } from '../lib/oauth/removeOAuthService';
import { updateOAuthServices } from '../lib/oauth/updateOAuthServices';
import { initOpenIDServices } from '../lib/openid/initOpenIDServices';
import { removeOpenIDService } from '../lib/openid/removeOpenIDService';
import { updateOpenIDServices } from '../lib/openid/updateOpenIDServices';

export async function configureOAuth(settings: ICachedSettings): Promise<void> {
	const _updateOAuthServices = debounce(updateOAuthServices, 2000);
	const _updateOpenIDServices = debounce(updateOpenIDServices, 2000);

	settings.watchByRegex(/^Accounts_OAuth_.+/, () => {
		return _updateOAuthServices();
	});

	settings.watchByRegex(/^Accounts_OAuth_Custom-[a-z0-9_]+/, (key, value) => {
		if (!value) {
			return removeOAuthService(key);
		}
	});

	settings.watchByRegex(/^Accounts_OpenID-.+/, () => {
		return _updateOpenIDServices();
	});

	settings.watchByRegex(/^Accounts_OpenID-[a-z0-9_]+/, (key, value) => {
		if (!value) {
			return removeOpenIDService(key);
		}
	});

	await initCustomOAuthServices();
	await initOpenIDServices();
}
