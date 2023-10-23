import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, usePermission, useSingleStream } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useLicense = (): UseQueryResult<OperationResult<'GET', '/v1/licenses.info'>> => {
	const getLicenses = useEndpoint('GET', '/v1/licenses.info');
	const canViewLicense = usePermission('view-privileged-setting');

	const queryClient = useQueryClient();

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries(['licenses', 'getLicenses']);
		},
		5000,
		[],
	);

	const notify = useSingleStream('notify-all');

	useEffect(() => notify('license', () => invalidate()), [notify, invalidate]);

	return useQuery(
		['licenses', 'getLicenses'],
		() => {
			if (!canViewLicense) {
				throw new Error('unauthorized api call');
			}
			return getLicenses({});
		},
		{
			staleTime: Infinity,
			keepPreviousData: true,
		},
	);
};
