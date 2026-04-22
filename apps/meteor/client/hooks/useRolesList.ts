import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useRolesList = () => {
	const rolesListEndpoint = useEndpoint('GET', '/v1/roles.list');

	return useQuery({
		queryKey: ['roles', 'list'],
		queryFn: () => rolesListEndpoint(),
		staleTime: 60_000,
	});
};
