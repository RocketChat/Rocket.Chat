import type { LicenseModule } from '@rocket.chat/core-typings';
import { useLicenseBase } from '@rocket.chat/ui-client';

export const useHasLicenseModule = (licenseName: LicenseModule | undefined) =>
	useLicenseBase({
		select: (data) => !!licenseName && data.license.activeModules.includes(licenseName),
	});
