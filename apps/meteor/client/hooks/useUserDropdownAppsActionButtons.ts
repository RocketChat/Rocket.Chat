import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppActionButtons } from './useAppActionButtons';
import { useApplyButtonAuthFilter } from './useApplyButtonFilters';
import { UiKitTriggerTimeoutError } from '../../app/ui-message/client/UiKitTriggerTimeoutError';
import { useUiKitActionManager } from '../uikit/hooks/useUiKitActionManager';

export const useUserDropdownAppsActionButtons = () => {
	const result = useAppActionButtons('userDropdownAction');
	const actionManager = useUiKitActionManager();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const applyButtonFilters = useApplyButtonAuthFilter();

	const data = useMemo(
		() =>
			result.data
				?.filter((action) => applyButtonFilters(action))
				.map((action): GenericMenuItemProps => {
					return {
						id: `${action.appId}_${action.actionId}`,
						// icon: action.icon as GenericMenuItemProps['icon'],
						content: action.labelI18n,
						onClick: () => {
							void actionManager
								.emitInteraction(action.appId, {
									type: 'actionButton',
									actionId: action.actionId,
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
					};
				}),
		[actionManager, applyButtonFilters, dispatchToastMessage, result.data, t],
	);
	return {
		...result,
		data,
	} as unknown as UseQueryResult<GenericMenuItemProps[]>;
};
