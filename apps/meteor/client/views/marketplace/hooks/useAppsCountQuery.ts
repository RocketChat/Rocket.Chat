import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useAppsCountQuery = () => {
	const getAppsCount = useEndpoint('GET', '/apps/count');
	return useQuery(
		['apps/count'],
		async () => {
			return getAppsCount();
		},
		{
			staleTime: 10_000,
		},
	);
};

export const useInvalidateAppsCountQueryCallback = () => {
	const queryClient = useQueryClient();
	return useCallback(() => {
		queryClient.invalidateQueries(['apps/count']);
	}, [queryClient]);
};
