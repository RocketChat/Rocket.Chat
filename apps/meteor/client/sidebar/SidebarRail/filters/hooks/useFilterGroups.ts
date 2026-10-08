import type { ISidebarFilter } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useSidebarFilters } from './useSidebarFiltersPreferences';
import { buildUnreadInfo } from '../../../hooks/useRoomList';
import { evaluateFilter } from '../lib/evaluateFilter';
import { sortSubscriptions } from '../lib/sortSubscriptions';

// Hidden rooms are included on purpose: a filter can ask for them through the `hidden` system label.
const query = {};

export type FilterGroup = {
	filter: ISidebarFilter;
	collapsed: boolean;
	rooms: SubscriptionWithRoom[];
	unreadInfo: ReturnType<typeof buildUnreadInfo>;
};

export const useFilterGroups = (collapsedGroups: string[]): FilterGroup[] => {
	const filters = useSidebarFilters();
	const subscriptions = useUserSubscriptions(query);
	const useRealName = Boolean(useSetting('UI_Use_Real_Name'));

	return useMemo(
		() =>
			filters.map((filter) => {
				const rooms = sortSubscriptions(
					subscriptions.filter((subscription) => evaluateFilter(filter, subscription)),
					filter.sort,
					useRealName,
				);

				return {
					filter,
					collapsed: collapsedGroups.includes(filter._id),
					rooms,
					unreadInfo: buildUnreadInfo(rooms),
				};
			}),
		[collapsedGroups, filters, subscriptions, useRealName],
	);
};
