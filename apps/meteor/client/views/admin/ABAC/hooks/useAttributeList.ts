import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useIsABACAvailable } from './useIsABACAvailable';
import { ABACQueryKeys } from '../../../../lib/queryKeys';
import { useRolesList } from '../../../../hooks/useRolesList';

const COUNT = 150;
const RC_USER_ROLE_ATTRIBUTE_KEY = 'RC-user-role';

type AttributeListItem = {
	_id: string;
	label: string;
	value: string;
	attributeValues: string[];
	valueLabels?: Record<string, string>;
};

export const useAttributeList = () => {
	const attributesAutoCompleteEndpoint = useEndpoint('GET', '/v1/abac/attributes');
	const isABACAvailable = useIsABACAvailable();
	const { data: rolesData } = useRolesList();

	const roleLabels = useMemo(() => {
		const labels: Record<string, string> = {};
		for (const role of rolesData?.roles ?? []) {
			labels[role._id] = role.name || role._id;
		}
		return labels;
	}, [rolesData]);

	const attributesQuery = useQuery({
		enabled: isABACAvailable,
		queryKey: ABACQueryKeys.roomAttributes.list(),
		queryFn: async () => {
			const firstPage = await attributesAutoCompleteEndpoint({ offset: 0, count: COUNT, includeUserRoleAttribute: true });
			const { attributes: firstPageAttributes, total } = firstPage;

			let currentPage = COUNT;
			const pages = [];

			while (currentPage < total) {
				pages.push(attributesAutoCompleteEndpoint({ offset: currentPage, count: COUNT }));
				currentPage += COUNT;
			}
			const remainingPages = await Promise.all(pages);

			return [...firstPageAttributes, ...remainingPages.flatMap((page) => page.attributes)];
		},
	});

	const data = useMemo(() => {
		if (!attributesQuery.data) {
			return undefined;
		}
		return {
			attributes: attributesQuery.data.map<AttributeListItem>((attribute) => ({
				_id: attribute._id,
				label: attribute.key,
				value: attribute.key,
				attributeValues: attribute.values,
				...(attribute.key === RC_USER_ROLE_ATTRIBUTE_KEY && { valueLabels: roleLabels }),
			})),
		};
	}, [attributesQuery.data, roleLabels]);

	return {
		...attributesQuery,
		data,
	};
};
