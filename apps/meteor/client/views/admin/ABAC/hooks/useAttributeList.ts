import { getNextPageOffset } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useIsABACAvailable } from './useIsABACAvailable';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

const COUNT = 150;
const ATTRIBUTE_LIST_STALE_TIME = 15_000;

export const useAttributeList = () => {
	const attributesAutoCompleteEndpoint = useEndpoint('GET', '/v1/abac/attributes');
	const isABACAvailable = useIsABACAvailable();

	return useQuery({
		enabled: isABACAvailable,
		staleTime: ATTRIBUTE_LIST_STALE_TIME,
		queryKey: ABACQueryKeys.roomAttributes.list(),
		queryFn: async () => {
			const pages = [];
			let offset: number | undefined = 0;

			while (offset !== undefined) {
				const page = await attributesAutoCompleteEndpoint({ offset, count: COUNT });
				pages.push(page);
				offset = getNextPageOffset(page);
			}

			return {
				attributes: pages
					.flatMap((page) => page.attributes)
					.map((attribute) => ({
						_id: attribute._id,
						label: attribute.key,
						value: attribute.key,
						attributeValues: attribute.values,
					})),
			};
		},
	});
};
