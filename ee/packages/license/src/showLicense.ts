import type { ILicenseV3 } from '@rocket.chat/core-typings';

import type { LicenseManager } from './license';
import { getModules } from './modules';

export function showLicense(this: LicenseManager, license: ILicenseV3 | undefined, valid: boolean | undefined) {
	if (!process.env.LICENSE_DEBUG || process.env.LICENSE_DEBUG === 'false') {
		return;
	}

	if (!license || !valid) {
		return;
	}

	const {
		validation: { serverUrls, validPeriods },
		limits,
	} = license;

	const modules = getModules.call(this);

	console.log('---- License enabled ----');
	console.log('              url ->', JSON.stringify(serverUrls));
	console.log('          periods ->', JSON.stringify(validPeriods));
	console.log('           limits ->', JSON.stringify(limits));
	console.log('          modules ->', modules.join(', '));
	console.log('-------------------------');
}
