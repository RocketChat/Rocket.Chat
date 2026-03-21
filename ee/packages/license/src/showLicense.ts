import { getPino } from '@rocket.chat/logger';
import type { ILicenseV3 } from '@rocket.chat/core-typings';

import type { LicenseManager } from './license';
import { getModules } from './modules';

const logger = getPino();

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

	logger.debug('---- License enabled ----');
	logger.debug('              url -> %s', JSON.stringify(serverUrls));
	logger.debug('          periods -> %s', JSON.stringify(validPeriods));
	logger.debug('           limits -> %s', JSON.stringify(limits));
	logger.debug('          modules -> %s', modules.join(', '));
	logger.debug('-------------------------');
}
