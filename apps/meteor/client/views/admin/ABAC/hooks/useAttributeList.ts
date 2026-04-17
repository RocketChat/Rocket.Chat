import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useIsABACAvailable } from './useIsABACAvailable';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

const COUNT = 150;

export const useAttributeList = () => {
	const attributesAutoCompleteEndpoint = useEndpoint('GET', '/v1/abac/attributes');
	const isABACAvailable = useIsABACAvailable();

	return useQuery({
		enabled: isABACAvailable,
		queryKey: ABACQueryKeys.roomAttributes.list(),
		queryFn: async () => {
			const firstPage = await attributesAutoCompleteEndpoint({ offset: 0, count: COUNT });
			const { attributes: firstPageAttributes, total } = firstPage;

			let currentPage = COUNT;
			const pages = [];

			while (currentPage < total) {
				pages.push(attributesAutoCompleteEndpoint({ offset: currentPage, count: COUNT }));
				currentPage += COUNT;
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
