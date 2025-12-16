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
			const { attributes: firstPageAttributes, total, count } = firstPage;

			// If there's only one page, return it
			if (total <= count) {
				return {
					...firstPage,
					attributes: firstPageAttributes.map((attribute) => ({
						_id: attribute._id,
						label: attribute.key,
						value: attribute.key,
						attributeValues: attribute.values,
					})),
				};
			}

			const remainingOffsets: number[] = [];
			for (let currentOffset = count; currentOffset < total; currentOffset += count) {
				remainingOffsets.push(currentOffset);
			}

			const remainingPages = await Promise.all(
				remainingOffsets.map((pageOffset) => attributesAutoCompleteEndpoint({ offset: pageOffset, count: COUNT })),
			);

			const allAttributes = [...firstPageAttributes, ...remainingPages.flatMap((page) => page.attributes)].map((attribute) => ({
				_id: attribute._id,
				label: attribute.key,
				value: attribute.key,
				attributeValues: attribute.values,
			}));

			return { attributes: allAttributes };
		},
	});
};
