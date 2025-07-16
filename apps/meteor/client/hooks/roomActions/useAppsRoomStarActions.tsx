import { Box } from '@rocket.chat/fuselage';
import { GenericMenu, HeaderToolbarAction } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { UiKitTriggerTimeoutError } from '../../../app/ui-message/client/UiKitTriggerTimeoutError';
import { Utilities } from '../../../ee/lib/misc/Utilities';
import { useUiKitActionManager } from '../../uikit/hooks/useUiKitActionManager';
import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import { useAppActionButtons } from '../useAppActionButtons';
import { useApplyButtonFilters } from '../useApplyButtonFilters';

export const useAppsRoomStarActions = () => {
	const result = useAppActionButtons('roomAction');
	const actionManager = useUiKitActionManager();
	const applyButtonFilters = useApplyButtonFilters('ai');
	const room = useRoom();
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!result.data) {
			return undefined;
		}

		const filteredActions = result.data.filter(applyButtonFilters);

		if (filteredActions.length === 0) {
			return undefined;
		}

		return {
			id: 'ai-actions',
			title: 'AI_Actions',
			icon: 'stars',
			groups: ['group', 'channel', 'live', 'team', 'direct', 'direct_multiple'],
			featured: true,
			renderToolboxItem: ({ id, icon, title, disabled, className }) => (
				<GenericMenu
					button={<HeaderToolbarAction />}
					key={id}
					title={title}
					disabled={disabled}
					items={filteredActions.map((action) => ({
						id: action.actionId,
						icon: undefined,
						title: Utilities.getI18nKeyForApp(action.labelI18n, action.appId),
						content: <Box is='span'>{t(`${Utilities.getI18nKeyForApp(action.labelI18n, action.appId)}`)}</Box>,
						variant: action.variant,
						groups: ['group', 'channel', 'live', 'team', 'direct', 'direct_multiple'],
						onClick: () => {
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
					}))}
					className={className}
					placement='bottom-start'
					icon={icon}
				/>
			),
		};
	}, [actionManager, applyButtonFilters, dispatchToastMessage, result.data, room._id, t]);
};
