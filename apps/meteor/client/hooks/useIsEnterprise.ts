import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useIsEnterprise = (): boolean => {
	const isEnterpriseEdition = useEndpoint('GET', '/v1/licenses.isEnterprise');
	const { data } = useQuery(['licenses.isEnterprise'], () => isEnterpriseEdition(), { keepPreviousData: true });
	return Boolean(data?.isEnterprise);
};
