import type { UseQueryResult } from '@tanstack/react-query';

import { useLicenseBase } from './useLicense';

export const useIsEnterprise = (): UseQueryResult<{ isEnterprise: boolean }> => {
	return useLicenseBase({ select: (data) => ({ isEnterprise: Boolean(data?.license.license) }) });
};
