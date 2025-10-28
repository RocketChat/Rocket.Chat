import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppActionButtons, getIdForActionButton } from './useAppActionButtons';
import { useApplyButtonFilters } from './useApplyButtonFilters';
import { UiKitTriggerTimeoutError } from '../../app/ui-message/client/UiKitTriggerTimeoutError';
import type { MessageBoxAction } from '../../app/ui-utils/client/lib/messageBox';
import { Utilities } from '../../ee/lib/misc/Utilities';
import { useUiKitActionManager } from '../uikit/hooks/useUiKitActionManager';

export const useMessageboxAppsActionButtons = () => {
	const result = useAppActionButtons('messageBoxAction');
	const actionManager = useUiKitActionManager();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const applyButtonFilters = useApplyButtonFilters();

	const data = useMemo(
		() =>
			result.data
				?.filter((action) => {
					return applyButtonFilters(action);
				})
				.map((action) => {
					const item: Omit<MessageBoxAction, 'icon'> = {
						id: getIdForActionButton(action),
						label: Utilities.getI18nKeyForApp(action.labelI18n, action.appId),
						action: (params) => {
							void actionManager
								.emitInteraction(action.appId, {
									type: 'actionButton',
									rid: params.rid,
									tmid: params.tmid,
									actionId: action.actionId,
									payload: { context: action.context, message: params.chat.composer?.text ?? '' },
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
					};

					return item;
				}) ?? [],
		[actionManager, applyButtonFilters, dispatchToastMessage, result.data, t],
	);

	return {
		...result,
		data,
	};
};
