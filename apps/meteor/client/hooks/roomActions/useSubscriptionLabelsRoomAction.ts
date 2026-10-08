import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useFilterModals } from '../../sidebar/SidebarRail/filters/hooks/useFilterModals';
import { useSidebarFiltersEnabled } from '../../sidebar/SidebarRail/filters/hooks/useSidebarFiltersEnabled';
import { useRoom, useRoomSubscription } from '../../views/room/contexts/RoomContext';

export const useSubscriptionLabelsRoomAction = () => {
	const room = useRoom();
	const subscription = useRoomSubscription();
	const enabled = useSidebarFiltersEnabled();
	const { openSubscriptionLabels } = useFilterModals();

	const capable = enabled && !!subscription && room.t !== 'l';

	const action = useStableCallback(() => openSubscriptionLabels(room._id));

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!capable) {
			return undefined;
		}

		return {
			id: 'subscription-labels',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Labels',
			icon: 'tag',
			order: 200,
			type: 'customization',
			action,
		};
	}, [action, capable]);
};
