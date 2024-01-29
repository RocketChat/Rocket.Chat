import type { OperationResult } from '@rocket.chat/rest-typings';
import type { UseQueryResult } from '@tanstack/react-query';

import { useLicenseBase } from './useLicense';

export const useIsEnterprise = (): UseQueryResult<OperationResult<'GET', '/v1/licenses.isEnterprise'>> => {
	return useLicenseBase({ select: (data) => ({ isEnterprise: Boolean(data?.license.license) }) });
};
