import type { LicenseLimitKind } from '@rocket.chat/core-typings';
import { useLicense } from '@rocket.chat/ui-client';

export const useShouldPreventAction = (action: LicenseLimitKind): boolean => {
	const { data: { preventedActions } = {} } = useLicense();

	return Boolean(preventedActions?.[action]);
};
