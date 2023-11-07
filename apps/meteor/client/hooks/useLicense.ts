import type { Serialized } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, useSingleStream } from '@rocket.chat/ui-contexts';
import type { QueryClient, UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

type LicenseDataType = Awaited<OperationResult<'GET', '/v1/licenses.info'>>['license'];

type LicenseParams = {
	loadValues?: boolean;
};

const invalidateQueryClientLicenses = (() => {
	let timeout: ReturnType<typeof setTimeout> | undefined;

	return (queryClient: QueryClient) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			timeout = undefined;
			queryClient.invalidateQueries(['licenses', 'getLicenses']);
		}, 5000);
	};
})();

export const useLicense = (params?: LicenseParams): UseQueryResult<Serialized<LicenseDataType>> => {
	const getLicenses = useEndpoint('GET', '/v1/licenses.info');

	const invalidateQueries = useInvalidateLicense();

	const notify = useSingleStream('notify-all');

	useEffect(() => notify('license', () => invalidateQueries()), [notify, invalidateQueries]);

	return useQuery(['licenses', 'getLicenses', params?.loadValues], () => getLicenses({ ...params }), {
		staleTime: Infinity,
		keepPreviousData: true,
		select: (data) => data.license,
	});
};

export const useInvalidateLicense = () => {
	const queryClient = useQueryClient();

	return () => invalidateQueryClientLicenses(queryClient);
};
