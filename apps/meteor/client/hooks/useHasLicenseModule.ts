import type { LicenseModule } from '@rocket.chat/core-typings';

import { useLicenseBase } from './useLicense';

export const useHasLicenseModule = (licenseName: LicenseModule | undefined): 'loading' | boolean => {
	return (
		useLicenseBase({
			select: (data) => !!licenseName && data.license.activeModules.includes(licenseName),
		}).data ?? 'loading'
	);
};
