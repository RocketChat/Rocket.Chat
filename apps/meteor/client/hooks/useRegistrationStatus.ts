import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

type useRegistrationStatusReturnType = {
	isRegistered?: boolean;
} & UseQueryResult<OperationResult<'GET', '/v1/cloud.registrationStatus'>>;

export const useRegistrationStatus = (): useRegistrationStatusReturnType => {
	const getRegistrationStatus = useEndpoint('GET', '/v1/cloud.registrationStatus');
	const canViewregistrationStatus = usePermission('manage-cloud');

	const queryResult = useQuery(
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

	return { isRegistered: !queryResult.isLoading && queryResult.data?.registrationStatus?.workspaceRegistered, ...queryResult };
};
