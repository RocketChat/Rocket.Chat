import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useRegistrationStatus = (): UseQueryResult<OperationResult<'GET', '/v1/cloud.registrationStatus'>> => {
	const getRegistrationStatus = useEndpoint('GET', '/v1/cloud.registrationStatus');
	const canViewregistrationStatus = usePermission('manage-cloud');

	return useQuery(
		['getRegistrationStatus'],
		() => {
			if (!canViewregistrationStatus) {
				throw new Error('unauthorized api call');
			}
			return getRegistrationStatus();
		},
		{
			keepPreviousData: true,
			staleTime: Infinity,
		},
	);
};
