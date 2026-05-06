import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useIsABACAvailable } from './useIsABACAvailable';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

const COUNT = 50;
const STALE_TIME = 5 * 60 * 1000;

export type AttributeKeyOption = {
	value: string;
	label: string;
	attributeValues: string[];
};

export const useAttributeKeysList = (filter: string) => {
	const list = useEndpoint('GET', '/v1/abac/attributes');
	const isABACAvailable = useIsABACAvailable();

	return useInfiniteQuery({
		enabled: isABACAvailable,
		queryKey: ABACQueryKeys.roomAttributes.autocomplete(filter),
		queryFn: async ({ pageParam: offset = 0 }) => list({ ...(filter ? { key: filter } : {}), offset, count: COUNT }),
		initialPageParam: 0,
		getNextPageParam: ({ offset, count, total }) => (offset + count < total ? offset + count : undefined),
		staleTime: STALE_TIME,
		select: (data) =>
			data.pages.flatMap<AttributeKeyOption>((page) =>
				page.attributes.map((attribute) => ({
					value: attribute.key,
					label: attribute.key,
					attributeValues: attribute.values,
				})),
			),
	});
};

export const useSelectedAttribute = (key?: string) => {
	const getAttributeByKey = useEndpoint('GET', '/v1/abac/attributes/key/:key', { key: key ?? '' });
	const isABACAvailable = useIsABACAvailable();

	return useQuery({
		enabled: isABACAvailable && !!key,
		queryKey: ABACQueryKeys.roomAttributes.byKey(key ?? ''),
		queryFn: () => getAttributeByKey(),
		staleTime: STALE_TIME,
	});
};
