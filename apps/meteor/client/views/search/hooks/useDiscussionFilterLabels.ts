import type { AppliedFilter } from '@rocket.chat/ai-search';
import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useDiscussionFilterLabels = (filters: AppliedFilter[]): AppliedFilter[] => {
	const query = useMemo(
		() => ({
			prid: { $exists: true },
			name: { $in: filters.filter(({ key, meta }) => key === 'in' && !meta?.label).map(({ value }) => value) },
		}),
		[filters],
	);
	const discussions = useUserSubscriptions(query);

	return useMemo(
		() =>
			filters.map((filter) => {
				if (filter.key !== 'in' || filter.meta?.label) {
					return filter;
				}

				const discussion = discussions.find(({ prid, name }) => prid && name === filter.value);

				return discussion?.fname ? { ...filter, meta: { ...filter.meta, label: discussion.fname } } : filter;
			}),
		[discussions, filters],
	);
};
