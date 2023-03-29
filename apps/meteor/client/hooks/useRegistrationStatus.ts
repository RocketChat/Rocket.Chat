import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useRegistrationStatus = (): UseQueryResult<OperationResult<'GET', '/v1/cloud.registrationStatus'>> => {
	const getRegistrationStatus = useEndpoint('GET', '/v1/cloud.registrationStatus');

	return useQuery(['getRegistrationStatus'], () => getRegistrationStatus(), {
		refetchOnWindowFocus: false,
		keepPreviousData: true,
		staleTime: Infinity,
	});
};
