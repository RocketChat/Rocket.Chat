import type { LicenseModule } from '@rocket.chat/core-typings';

import { useLicenseBase } from './useLicense.js';

export const useHasLicenseModule = (licenseName: LicenseModule | undefined) =>
	useLicenseBase({
		select: (data) => !!licenseName && data.license.activeModules.includes(licenseName),
	});
