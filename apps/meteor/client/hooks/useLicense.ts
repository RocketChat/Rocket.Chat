import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useLicense = (): UseQueryResult<OperationResult<'GET', '/v1/licenses.get'>> => {
	const getLicenses = useEndpoint('GET', '/v1/licenses.get');
	const canViewLicense = usePermission('view-privileged-setting');

	return useQuery(
		['licenses', 'getLicenses'],
		() => {
			if (!canViewLicense) {
				throw new Error('unauthorized api call');
			}
			return getLicenses();
		},
		{
			staleTime: Infinity,
			keepPreviousData: true,
		},
	);
};
