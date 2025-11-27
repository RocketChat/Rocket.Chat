import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { ABACQueryKeys } from '../../../../lib/queryKeys';

const useABACAttributeList = (filter?: string) => {
	const attributesAutoCompleteEndpoint = useEndpoint('GET', '/v1/abac/attributes');

	return useInfiniteQuery({
		queryKey: ABACQueryKeys.roomAttributes.roomAttributesList({ key: filter ?? '' }),
		queryFn: async ({ pageParam: offset = 0 }) => {
			// TODO: Check endpoint types
			const { attributes, ...data } = await attributesAutoCompleteEndpoint({ key: filter, offset, count: 15 });

			return {
				...data,
				attributes: attributes.map((attribute) => ({
					_id: attribute._id,
					label: attribute.key,
					value: attribute.key,
					attributeValues: attribute.values,
				})),
			};
		},
		select: (data) => data.pages.flatMap((page) => page.attributes),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset < lastPage.total ? offset : undefined;
		},
		initialData: () => ({
			pages: [{ attributes: [], offset: 0, count: 0, total: Infinity }],
			pageParams: [0],
		}),
	});
};

export default useABACAttributeList;
