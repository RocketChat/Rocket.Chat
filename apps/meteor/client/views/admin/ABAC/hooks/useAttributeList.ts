import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useIsABACAvailable } from './useIsABACAvailable';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

const COUNT = 150;
const ATTRIBUTE_LIST_STALE_TIME = 15_000;

export type UseAttributeListOptions = {
	/**
	 * Ask the server for only the attributes this user could actually be granted (ABAC-P4/D12).
	 * The room-facing pickers set it; the administrative surfaces do not, and keep listing every
	 * definition (ABAC-P4/D11). It is honoured only where the rule is in force — under a Virtru
	 * PDP the store already answers from the subject's entitlements.
	 */
	assignableOnly?: boolean;
};

export const useAttributeList = ({ assignableOnly = false }: UseAttributeListOptions = {}) => {
	const attributesAutoCompleteEndpoint = useEndpoint('GET', '/v1/abac/attributes');
	const isABACAvailable = useIsABACAvailable();

	return useQuery({
		enabled: isABACAvailable,
		staleTime: ATTRIBUTE_LIST_STALE_TIME,
		queryKey: ABACQueryKeys.roomAttributes.list({ assignableOnly }),
		queryFn: async () => {
			const firstPage = await attributesAutoCompleteEndpoint({ offset: 0, count: COUNT, ...(assignableOnly && { assignableOnly: true }) });
			const { attributes: firstPageAttributes, total } = firstPage;

			let currentPage = COUNT;
			const pages = [];

			while (currentPage < total) {
				pages.push(attributesAutoCompleteEndpoint({ offset: currentPage, count: COUNT, ...(assignableOnly && { assignableOnly: true }) }));
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
