import type { Serialized } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, useSingleStream, useUserId } from '@rocket.chat/ui-contexts';
import type { QueryClient, UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

type LicenseDataType = Serialized<Awaited<OperationResult<'GET', '/v1/licenses.info'>>>;

type LicenseParams = {
	loadValues?: boolean;
};

const invalidateQueryClientLicenses = (() => {
	let timeout: ReturnType<typeof setTimeout> | undefined;

	return (queryClient: QueryClient, milliseconds = 5000) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			timeout = undefined;
			queryClient.invalidateQueries(['licenses']);
		}, milliseconds);
	};
})();

export const useLicenseBase = <TData = LicenseDataType>({
	params,
	select,
}: {
	params?: LicenseParams;
	select: (data: LicenseDataType) => TData;
}) => {
	const uid = useUserId();

	const getLicenses = useEndpoint('GET', '/v1/licenses.info');

	const invalidateQueries = useInvalidateLicense();

	const notify = useSingleStream('notify-all');

	useEffect(() => notify('license', () => invalidateQueries()), [notify, invalidateQueries]);

	return useQuery(['licenses', 'getLicenses', params], () => getLicenses({ ...params }), {
		staleTime: Infinity,
		keepPreviousData: true,
		select,
		enabled: !!uid,
	});
};

export const useLicense = (params?: LicenseParams) => {
	return useLicenseBase({ params, select: (data) => data.license });
};

export const useHasLicense = (): UseQueryResult<boolean> => {
	return useLicenseBase({ select: (data) => Boolean(data.license) });
};

export const useLicenseName = (params?: LicenseParams) => {
	return useLicenseBase({ params, select: (data) => data?.license.tags?.map((tag) => tag.name).join(' ') || 'Community' });
};

export const useInvalidateLicense = () => {
	const queryClient = useQueryClient();
	return (milliseconds?: number) => invalidateQueryClientLicenses(queryClient, milliseconds);
};
