import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useLicense = (): UseQueryResult<OperationResult<'GET', '/v1/licenses.get'>> => {
	const getLicenses = useEndpoint('GET', '/v1/licenses.get');

	return useQuery(['licenses', 'getLicenses'], () => getLicenses(), {
		staleTime: Infinity,
		keepPreviousData: true,
		refetchOnWindowFocus: false,
	});
};
