import { useMemo } from 'react';

import { Utilities } from '../../../../../ee/lib/misc/Utilities';
import { useAppActionButtons } from '../../../../hooks/useAppActionButtons';
import { useApplyButtonFilters } from '../../../../hooks/useApplyButtonFilters';
import { useUiKitActionManager } from '../../../../hooks/useUiKitActionManager';
import { useRoom } from '../../contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../contexts/RoomToolboxContext';

export const useAppsRoomActions = () => {
	const result = useAppActionButtons('roomAction');
	const actionManager = useUiKitActionManager();
	const applyButtonFilters = useApplyButtonFilters();
	const room = useRoom();

	return useMemo(
		() =>
			result.data?.filter(applyButtonFilters).map(
				(action): RoomToolboxActionConfig => ({
					id: action.actionId,
					icon: undefined,
					variant: action.variant,
					order: 300,
					title: Utilities.getI18nKeyForApp(action.labelI18n, action.appId),
					groups: ['group', 'channel', 'live', 'team', 'direct', 'direct_multiple'],
					// Filters were applied in the applyButtonFilters function
					// if the code made it this far, the button should be shown
					action: () =>
						void actionManager.triggerActionButtonAction({
							rid: room._id,
							actionId: action.actionId,
							appId: action.appId,
							payload: { context: action.context },
						}),
					type: 'apps',
				}),
			) ?? [],
		[actionManager, applyButtonFilters, result.data, room._id],
	);
};
