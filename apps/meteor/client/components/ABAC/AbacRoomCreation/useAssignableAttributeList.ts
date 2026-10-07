import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { ABACQueryKeys } from '../../../lib/queryKeys';

export const useAssignableAttributeList = (enabled = true) => {
	const getAssignableAttributes = useEndpoint('GET', '/v1/abac/assignable-attributes');

	return useQuery({
		queryKey: ABACQueryKeys.assignableAttributes(),
		queryFn: async () => (await getAssignableAttributes({})).attributes,
		enabled,
		staleTime: 15_000,
		refetchOnWindowFocus: false,
	});
};
