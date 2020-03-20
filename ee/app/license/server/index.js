import { settings } from '../../../../app/settings/server';
import { getWorkspaceLicense } from '../../../../app/cloud/server';
import { callbacks } from '../../../../app/callbacks';
import { addLicense, onLicense, setURL } from './license';
import init from './init';
import './methods';

settings.get('Site_Url', (key, value) => {
	if (value) {
		setURL(value);
	}
});

init();

const { license } = getWorkspaceLicense();

if (license) {
	addLicense(license);
}

if (process.env.ROCKETCHAT_LICENSE) {
	addLicense(process.env.ROCKETCHAT_LICENSE);
}

callbacks.add('workspaceLicenseChanged', (updatedLicense) => {
	addLicense(updatedLicense);
});

export { onLicense };
