import { setLicense, setWorkspaceUrl, setLicenseLimitCounter } from '@rocket.chat/license';

import { settings } from '../../../../app/settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { getAppCount } from './lib/getAppCount';

settings.watch<string>('Site_Url', (value) => {
	if (value) {
		void setWorkspaceUrl(value);
	}
});

callbacks.add('workspaceLicenseChanged', async (updatedLicense) => {
	await setLicense(updatedLicense);
});

setLicenseLimitCounter('privateApps', () => getAppCount('private'));
setLicenseLimitCounter('marketplaceApps', () => getAppCount('marketplace'));
