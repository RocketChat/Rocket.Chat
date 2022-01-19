import { settings } from '../../../../app/settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { addLicense, setURL } from './license';

settings.watch('Site_Url', (value: string) => {
	if (value) {
		setURL(value);
	}
});

callbacks.add('workspaceLicenseChanged', (updatedLicense: string) => {
	addLicense(updatedLicense);
});
