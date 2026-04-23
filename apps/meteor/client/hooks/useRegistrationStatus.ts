import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

type useRegistrationStatusReturnType = {
	canViewRegistrationStatus: boolean;
	isRegistered?: boolean;
} & UseQueryResult<OperationResult<'GET', '/v1/cloud.registrationStatus'>>;

export const useRegistrationStatus = (): useRegistrationStatusReturnType => {
	const getRegistrationStatus = useEndpoint('GET', '/v1/cloud.registrationStatus');
	const canViewRegistrationStatus = usePermission('manage-cloud');

	const queryResult = useQuery({
		queryKey: ['getRegistrationStatus'],
		queryFn: () => {
			if (!canViewRegistrationStatus) {
				throw new Error('unauthorized api call');
			}
			return getRegistrationStatus();
		},
		staleTime: Infinity,
	});

	return {
		canViewRegistrationStatus,
		isRegistered: !queryResult.isPending && queryResult.data?.registrationStatus?.workspaceRegistered,
		...queryResult,
	};
};
