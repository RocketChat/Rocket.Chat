import type { ILicenseV3, LicenseLimitKind } from './definition/ILicenseV3';
import type { LicenseModule } from './definition/LicenseModule';
import { getLicense, startedFairPolicy } from './license';
import { getModules } from './modules';
import { getCurrentValueForLicenseLimit } from './validation/getCurrentValueForLicenseLimit';

export const getLicenseInfo = async (
	loadCurrentValues = false,
): Promise<{
	license: ILicenseV3 | undefined;
	activeModules: LicenseModule[];
	limits: Record<LicenseLimitKind, { value?: number; max: number }>;
	inFairPolicy: boolean;
}> => {
	const activeModules = getModules();
	const license = getLicense();

	// Get all limits present in the license and their current value
	const limits = (
		(license &&
			(await Promise.all(
				(['activeUsers', 'guestUsers', 'privateApps', 'marketplaceApps', 'monthlyActiveContacts'] as LicenseLimitKind[])
					.map((limitKey) => ({
						limitKey,
						max: Math.max(-1, Math.min(...Array.from(license.limits[limitKey as LicenseLimitKind] || [])?.map(({ max }) => max))),
					}))
					.filter(({ max }) => max >= 0 && max < Infinity)
					.map(async ({ max, limitKey }) => {
						return {
							[limitKey as LicenseLimitKind]: {
								...(loadCurrentValues ? { value: await getCurrentValueForLicenseLimit(limitKey as LicenseLimitKind) } : {}),
								max,
							},
						};
					}),
			))) ||
		[]
	).reduce((prev, curr) => ({ ...prev, ...curr }), {});

	return {
		license,
		activeModules,
		limits: limits as Record<LicenseLimitKind, { max: number; value: number }>,
		inFairPolicy: startedFairPolicy(),
	};
};
