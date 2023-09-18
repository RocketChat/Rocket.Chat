import type { LicenseLimitKind } from '../definition/ILicenseV3';
import type { LimitContext } from '../definition/LimitContext';
import { getLicense } from '../license';
import { getCurrentValueForLicenseLimit } from './getCurrentValueForLicenseLimit';

export const shouldPreventAction = async <T extends LicenseLimitKind>(
	action: T,
	context?: Partial<LimitContext<T>>,
	newCount = 1,
): Promise<boolean> => {
	const license = getLicense();

	const currentValue = (await getCurrentValueForLicenseLimit(action, context)) + newCount;
	return Boolean(
		license?.limits[action]?.filter(({ behavior, max }) => behavior === 'prevent_action' && max >= 0).some(({ max }) => max < currentValue),
	);
};
