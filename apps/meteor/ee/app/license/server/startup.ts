import { settings } from '../../../../app/settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { setLicense, setURL } from './license';

settings.watch<string>('Site_Url', (value) => {
	if (value) {
		void setURL(value);
	}
});

callbacks.add('workspaceLicenseChanged', async (updatedLicense) => {
	await setLicense(updatedLicense);
});
