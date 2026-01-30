import { useLicenseBase } from '@rocket.chat/ui-client';
import type { UseQueryResult } from '@tanstack/react-query';

export const useIsEnterprise = (): UseQueryResult<{ isEnterprise: boolean }> => {
	return useLicenseBase({ select: (data) => ({ isEnterprise: Boolean(data?.license.hasValidLicense) }) });
};
