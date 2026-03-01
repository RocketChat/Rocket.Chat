import type { ILicenseV3 } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';

import type { LicenseManager } from './license';
import { getModules } from './modules';

const logger = new Logger('License:ShowLicense');

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

	logger.info('---- License enabled ----');
	logger.info('              url ->', JSON.stringify(serverUrls));
	logger.info('          periods ->', JSON.stringify(validPeriods));
	logger.info('           limits ->', JSON.stringify(limits));
	logger.info('          modules ->', modules.join(', '));
	logger.info('-------------------------');
}
