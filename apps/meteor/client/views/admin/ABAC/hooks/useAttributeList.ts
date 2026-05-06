import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useIsABACAvailable } from './useIsABACAvailable';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

const COUNT = 50;

export type AttributeKeyOption = {
	_id: string;
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
		select: (data) =>
			data.pages.flatMap<AttributeKeyOption>((page) =>
				page.attributes.map((attribute) => ({
					_id: attribute._id,
					value: attribute.key,
					label: attribute.key,
					attributeValues: attribute.values,
				})),
			),
	});
};

export const useSelectedAttribute = (key?: string) => {
	const list = useEndpoint('GET', '/v1/abac/attributes');
	const isABACAvailable = useIsABACAvailable();

	return useQuery({
		enabled: isABACAvailable && !!key,
		queryKey: ABACQueryKeys.roomAttributes.byKey(key ?? ''),
		queryFn: () => list({ key, offset: 0, count: 25 }),
		select: (data) => data.attributes.find((attribute) => attribute.key === key),
	});
};
