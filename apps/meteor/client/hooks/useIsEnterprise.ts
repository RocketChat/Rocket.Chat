import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useIsEnterprise = (): UseQueryResult<OperationResult<'GET', '/v1/licenses.isEnterprise'>> => {
	const isEnterpriseEdition = useEndpoint('GET', '/v1/licenses.isEnterprise');
	return useQuery(['licenses', 'isEnterprise'], () => isEnterpriseEdition(), {
		keepPreviousData: true,
		refetchOnWindowFocus: false,
		staleTime: Infinity,
	});
};
