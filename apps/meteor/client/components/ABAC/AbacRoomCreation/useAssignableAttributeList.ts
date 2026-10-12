import type { Serialized } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { ABACQueryKeys } from '../../../lib/queryKeys';

type AssignableAttributes = Serialized<OperationResult<'GET', '/v1/abac/attributes.listAssignable'>>;

export const useAssignableAttributes = <TData = AssignableAttributes>(enabled: boolean, select?: (data: AssignableAttributes) => TData) => {
	const getAssignableAttributes = useEndpoint('GET', '/v1/abac/attributes.listAssignable');

	return useQuery({
		queryKey: ABACQueryKeys.assignableAttributes(),
		queryFn: () => getAssignableAttributes(),
		enabled,
		select,
		staleTime: 15_000,
		refetchOnWindowFocus: false,
	});
};

export const useAssignableAttributeList = (enabled = true) => useAssignableAttributes(enabled, (data) => data.attributes);
