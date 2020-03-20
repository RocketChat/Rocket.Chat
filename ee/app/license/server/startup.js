import { settings } from '../../../../app/settings/server';
import { getWorkspaceLicense } from '../../../../app/cloud/server';
import { callbacks } from '../../../../app/callbacks';
import { addLicense, setURL } from './license';
import './settings';
import './methods';

settings.get('Site_Url', (key, value) => {
	if (value) {
		setURL(value);
	}
});

const { license } = getWorkspaceLicense();

if (license) {
	addLicense(license);
}

callbacks.add('workspaceLicenseChanged', (updatedLicense) => {
	addLicense(updatedLicense);
});
