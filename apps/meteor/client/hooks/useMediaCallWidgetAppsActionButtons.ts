import '@rocket.chat/apps-engine/experimental/MediaCallActionButtons';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type {
	MediaCallAppActionDescriptor,
	MediaCallAppActionsProviderProps,
} from '@rocket.chat/ui-voip/dist/experimental/AppActionButtons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppActionButtons } from './useAppActionButtons';
import { useApplyButtonAuthFilter } from './useApplyButtonFilters';
import { UiKitTriggerTimeoutError } from '../../app/ui-message/client/UiKitTriggerTimeoutError';
import { Utilities } from '../../ee/lib/misc/Utilities';
import { useUiKitActionManager } from '../uikit/hooks/useUiKitActionManager';

export const useMediaCallWidgetAppsActionButtons = () => {
	const actionManager = useUiKitActionManager();
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const applyAuthFilter = useApplyButtonAuthFilter();
	const { data } = useAppActionButtons('mediaCallWidgetAction');

	return useMemo<Omit<MediaCallAppActionsProviderProps, 'children'>>(
		() => ({
			actions:
				data
					?.filter((button) => applyAuthFilter(button))
					.map(
						(action): MediaCallAppActionDescriptor => ({
							label: t(Utilities.getI18nKeyForApp(action.labelI18n, action.appId)),
							variant: action.variant,
							appId: action.appId,
							actionId: action.actionId,
							...(action.when?.callStates ? { callStates: action.when.callStates } : {}),
						}),
					) || [],

			handleInteraction: async ({ button, sessionState }) =>
				actionManager
					.emitInteraction(button.appId, {
						type: 'actionButton',
						actionId: button.actionId,
						rid: sessionState.roomId,
						payload: {
							context: 'mediaCallWidgetAction',
							callId: sessionState.callId,
						},
					})
					.catch((error) => {
						if (error instanceof UiKitTriggerTimeoutError) {
							dispatchToastMessage({ type: 'error', message: t('The_action_took_too_long_to_complete') });
						} else {
							dispatchToastMessage({ type: 'error', message: t('An_error_occurred_while_executing_the_action') });
						}
					})
					.then((response) => {
						if (!response) {
							return;
						}

						const { update, appId } = response;

						return {
							update: {
								...(update.labelI18n && { label: t(Utilities.getI18nKeyForApp(update.labelI18n, appId)) }),
								...(update.variant && { variant: update.variant }),
								...(update.disabled !== undefined && { disabled: update.disabled }),
								...(update.actionId && { actionId: update.actionId }),
							},
						};
					}),
		}),
		[actionManager, applyAuthFilter, data, dispatchToastMessage, t],
	);
};
