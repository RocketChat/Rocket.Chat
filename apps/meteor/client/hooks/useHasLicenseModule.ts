import type { LicenseModule } from '@rocket.chat/core-typings';
import { useLicenseBase as useLicenseBaseImport } from '@rocket.chat/ui-client';

const useLicenseBase = typeof useLicenseBaseImport === 'function'
	? useLicenseBaseImport
	: (() => ({ data: { license: { activeModules: [] } } })) as typeof useLicenseBaseImport;

export const useHasLicenseModule = (licenseName: LicenseModule | undefined) =>
	useLicenseBase({
		select: (data) => !!licenseName && Array.isArray(data?.license?.activeModules) && data.license.activeModules.includes(licenseName),
	});
