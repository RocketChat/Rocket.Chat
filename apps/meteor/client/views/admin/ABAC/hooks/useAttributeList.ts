import { useApiCountLimit, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useIsABACAvailable } from './useIsABACAvailable';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

const ATTRIBUTE_LIST_STALE_TIME = 15_000;

export const useAttributeList = () => {
	const attributesAutoCompleteEndpoint = useEndpoint('GET', '/v1/abac/attributes');
	const isABACAvailable = useIsABACAvailable();
	const count = useApiCountLimit();

	return useQuery({
		enabled: isABACAvailable,
		staleTime: ATTRIBUTE_LIST_STALE_TIME,
		queryKey: ABACQueryKeys.roomAttributes.list(),
		queryFn: async () => {
			const firstPage = await attributesAutoCompleteEndpoint({ offset: 0, count });
			const { attributes: firstPageAttributes, total } = firstPage;

			let currentPage = count;
			const pages = [];

			while (currentPage < total) {
				pages.push(attributesAutoCompleteEndpoint({ offset: currentPage, count }));
				currentPage += count;
			}
			const remainingPages = await Promise.all(pages);

			return {
				attributes: [...firstPageAttributes, ...remainingPages.flatMap((page) => page.attributes)].map((attribute) => ({
					_id: attribute._id,
					label: attribute.key,
					value: attribute.key,
					attributeValues: attribute.values,
				})),
			};
		},
	});
};
