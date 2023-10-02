import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

const queryKey = ['licenses', 'isEnterprise'] as const;

export const useIsEnterprise = (
	options?: UseQueryOptions<
		OperationResult<'GET', '/v1/licenses.isEnterprise'>,
		unknown,
		OperationResult<'GET', '/v1/licenses.isEnterprise'>,
		typeof queryKey
	>,
): UseQueryResult<OperationResult<'GET', '/v1/licenses.isEnterprise'>> => {
	const isEnterpriseEdition = useEndpoint('GET', '/v1/licenses.isEnterprise');

	return useQuery(queryKey, () => isEnterpriseEdition(), {
		keepPreviousData: true,
		staleTime: Infinity,
		...options,
	});
};
