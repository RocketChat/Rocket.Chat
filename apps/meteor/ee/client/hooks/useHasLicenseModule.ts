import type { LicenseModule } from '@rocket.chat/license';

import { useLicenseBase } from '../../../client/hooks/useLicense';

export const useHasLicenseModule = (licenseName: LicenseModule): 'loading' | boolean => {
	return (
		useLicenseBase({
			select: (data) => data.license.activeModules.includes(licenseName),
		}).data ?? 'loading'
	);
};
