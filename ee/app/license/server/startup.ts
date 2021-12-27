import { settings } from '../../../../app/settings/server';
import { callbacks } from '../../../../app/callbacks/server';
import { addLicense, setURL } from './license';

settings.watch('Site_Url', (value: string) => {
	if (value) {
		setURL(value);
	}
});

callbacks.add('workspaceLicenseChanged', (updatedLicense: string) => {
	addLicense(updatedLicense);
});
