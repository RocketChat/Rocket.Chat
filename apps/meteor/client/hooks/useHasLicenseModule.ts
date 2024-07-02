import type { LicenseModule } from '@rocket.chat/core-typings';

import { useLicenseBase } from './useLicense';

export const useHasLicenseModule = (licenseName: LicenseModule): 'loading' | boolean => {
	return (
		useLicenseBase({
			select: (data) => data.license.activeModules.includes(licenseName),
		}).data ?? 'loading'
	);
};
