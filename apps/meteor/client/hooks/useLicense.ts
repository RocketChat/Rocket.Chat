import type { Serialized } from '@rocket.chat/core-typings';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, useSingleStream } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

type LicenseDataType = Awaited<OperationResult<'GET', '/v1/licenses.info'>>['license'];

export const useLicense = (): UseQueryResult<Serialized<LicenseDataType>> => {
	const getLicenses = useEndpoint('GET', '/v1/licenses.info');

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

	return useQuery(['licenses', 'getLicenses'], () => getLicenses({}), {
		staleTime: Infinity,
		keepPreviousData: true,
		select: (data) => data.license,
	});
};
