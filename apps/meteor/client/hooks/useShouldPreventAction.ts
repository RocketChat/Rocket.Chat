import type { LicenseLimitKind } from '@rocket.chat/core-typings';
import { useLicense as useLicenseImport } from '@rocket.chat/ui-client';

const useLicense = typeof useLicenseImport === 'function'
	? useLicenseImport
	: (() => ({ data: { preventedActions: {} } })) as typeof useLicenseImport;

export const useShouldPreventAction = (action: LicenseLimitKind): boolean => {
	const { data: { preventedActions } = {} } = useLicense();

	return Boolean(preventedActions?.[action]);
};
