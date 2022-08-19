import { CloudRegistrationStatus, ILicense } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useLicense = (): {
	licenses: ILicense[] | undefined;
	registrationStatus: CloudRegistrationStatus | undefined;
	isError: boolean;
	isLoading: boolean;
	isSuccess: boolean;
} => {
	const getRegistrationStatus = useEndpoint('GET', '/v1/cloud.registrationStatus');
	const getLicenses = useEndpoint('GET', '/v1/licenses.get');

	const { data: registrationStatusData } = useQuery(['registrationStatus'], () => getRegistrationStatus(), {
		refetchOnWindowFocus: false,
		keepPreviousData: true,
		staleTime: Infinity,
	});
	const { data, isError, isLoading, isSuccess } = useQuery(['licenses'], () => getLicenses(), {
		staleTime: Infinity,
		keepPreviousData: true,
		refetchOnWindowFocus: false,
		enabled: !!registrationStatusData,
	});

	const registrationStatus = registrationStatusData?.registrationStatus;
	const licenses = data?.licenses;

	return { licenses, isError, isLoading, isSuccess, registrationStatus };
};
