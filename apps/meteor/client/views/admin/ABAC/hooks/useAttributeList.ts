import { AuthorizationContext, useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useContext, useMemo } from 'react';

import { useIsABACAvailable } from './useIsABACAvailable';
import { ABACQueryKeys } from '../../../../lib/queryKeys';
import { RC_USER_ROLE_ATTRIBUTE_KEY, RC_USER_ROLE_ATTRIBUTE_SYNTHETIC_ID } from '../constants';

const COUNT = 150;

type AttributeListItem = {
	_id: string;
	label: string;
	value: string;
	attributeValues: string[];
};

export const useAttributeList = () => {
	const attributesAutoCompleteEndpoint = useEndpoint('GET', '/v1/abac/attributes');
	const isABACAvailable = useIsABACAvailable();

	const useUserRolesAsAttributes = useSetting('ABAC_Use_User_Roles_As_Attributes', false);
	const pdpType = useSetting('ABAC_PDP_Type', 'local');

	const { getRoles } = useContext(AuthorizationContext);

	const attributesQuery = useQuery({
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

			return [...firstPageAttributes, ...remainingPages.flatMap((page) => page.attributes)];
		},
	});

	const data = useMemo(() => {
		if (!attributesQuery.data) {
			return undefined;
		}

		const attributes: AttributeListItem[] = attributesQuery.data.map((attribute) => ({
			_id: attribute._id,
			label: attribute.key,
			value: attribute.key,
			attributeValues: attribute.values,
		}));

		if (useUserRolesAsAttributes && pdpType === 'local') {
			attributes.unshift({
				_id: RC_USER_ROLE_ATTRIBUTE_SYNTHETIC_ID,
				label: RC_USER_ROLE_ATTRIBUTE_KEY,
				value: RC_USER_ROLE_ATTRIBUTE_KEY,
				attributeValues: [...getRoles().keys()],
			});
		}

		return { attributes };
	}, [attributesQuery.data, useUserRolesAsAttributes, pdpType, getRoles]);

	return {
		...attributesQuery,
		data,
	};
};
