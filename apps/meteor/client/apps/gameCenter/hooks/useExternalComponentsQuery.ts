import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useExternalComponentsQuery = () => {
	const getExternalComponents = useEndpoint('GET', '/apps/externalComponents');
	return useQuery({
		queryKey: ['apps/external-components'],

		queryFn: async () => {
			return (await getExternalComponents()).externalComponents;
		},

		staleTime: 10_000,
	});
};
