import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useIsEnterprise = (): { isEnterprise: boolean; isLoading: boolean } => {
	const isEnterpriseEdition = useEndpoint('GET', '/v1/licenses.isEnterprise');
	const { data, isLoading } = useQuery(['licenses.isEnterprise'], () => isEnterpriseEdition(), {
		keepPreviousData: true,
		refetchOnWindowFocus: false,
		staleTime: Infinity,
	});

	return { isEnterprise: Boolean(data?.isEnterprise), isLoading };
};
