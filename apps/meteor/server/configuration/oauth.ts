import { settings } from '../../app/settings/server/cached';
import { debounce } from '../../app/utils/debounce';
import { initCustomOAuthServices } from '../lib/oauth/initCustomOAuthServices';
import { removeOAuthService } from '../lib/oauth/removeOAuthService';
import { updateOAuthServices } from '../lib/oauth/updateOAuthServices';

export async function configureOAuth() {
	const _updateOAuthServices = debounce(updateOAuthServices, 2000);
	settings.watchByRegex(/^Accounts_OAuth_.+/, () => {
		return _updateOAuthServices();
	});

	settings.watchByRegex(/^Accounts_OAuth_Custom-[a-z0-9_]+/, (key, value) => {
		if (!value) {
			return removeOAuthService(key);
		}
	});

	await initCustomOAuthServices();
}
