import { SettingsVersion4 } from '../../../../app/settings/server';
import { callbacks } from '../../../../app/callbacks';
import { addLicense, setURL } from './license';

SettingsVersion4.watch('Site_Url', (value) => {
	if (value) {
		setURL(value);
	}
});

callbacks.add('workspaceLicenseChanged', (updatedLicense) => {
	addLicense(updatedLicense);
});
