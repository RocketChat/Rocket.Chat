import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { UiKitTriggerTimeoutError } from '../../../../../app/ui-message/client/UiKitTriggerTimeoutError';
import { Utilities } from '../../../../../ee/lib/misc/Utilities';
import { useAppActionButtons } from '../../../../hooks/useAppActionButtons';
import { useApplyButtonFilters } from '../../../../hooks/useApplyButtonFilters';
import { useUiKitActionManager } from '../../../../uikit/hooks/useUiKitActionManager';
import { useRoom } from '../../contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../contexts/RoomToolboxContext';

export const useAppsRoomActions = () => {
	const result = useAppActionButtons('roomAction');
	const actionManager = useUiKitActionManager();
	const applyButtonFilters = useApplyButtonFilters();
	const room = useRoom();
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

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
					action: () => {
						void actionManager
							.emitInteraction(action.appId, {
								type: 'actionButton',
								actionId: action.actionId,
								rid: room._id,
								payload: { context: action.context },
							})
							.catch(async (reason) => {
								if (reason instanceof UiKitTriggerTimeoutError) {
									dispatchToastMessage({
										type: 'error',
										message: t('UIKit_Interaction_Timeout'),
									});
									return;
								}

								return reason;
							});
					},
					type: 'apps',
				}),
			) ?? [],
		[actionManager, applyButtonFilters, dispatchToastMessage, result.data, room._id, t],
	);
};
