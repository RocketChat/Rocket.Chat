import { settings } from '../../../../server/settings';
import { callbacks } from '../../../../app/callbacks';
import { addLicense, setURL } from './license';

settings.get('Site_Url', (key, value) => {
	if (value) {
		setURL(value);
	}
});

callbacks.add('workspaceLicenseChanged', (updatedLicense) => {
	addLicense(updatedLicense);
});
