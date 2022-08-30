import { Serialized } from '@rocket.chat/core-typings';
import { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useCallback } from 'react';

type FetchAllReturn = [Serialized<OperationResult<'GET', '/v1/statistics'>>, Serialized<OperationResult<'GET', '/v1/instances.get'>>];

type UseInformationPageDataReturn = Omit<UseQueryResult<FetchAllReturn>, 'refetch'> & { refetch: () => Promise<void> };

export const useInformationPageData = (): UseInformationPageDataReturn => {
	const getStatistics = useEndpoint('GET', '/v1/statistics');
	const getInstances = useEndpoint('GET', '/v1/instances.get');

	const fetchAll = useCallback<(refresh: boolean) => Promise<FetchAllReturn>>(
		async (refresh) => Promise.all([getStatistics({ refresh: refresh ? 'true' : 'false' }), getInstances()]),
		[getStatistics, getInstances],
	);

	const queryClient = useQueryClient();
	const queryReturn = useQuery(['admin/info'], async () => fetchAll(false));

	const refetch = useCallback(async (): Promise<void> => {
		if (queryReturn.isLoading) {
			return;
		}

		queryClient.setQueryData(['admin/info'], async () => fetchAll(true));
	}, [queryReturn.isLoading, queryClient, fetchAll]);

	return { ...queryReturn, refetch };
};
