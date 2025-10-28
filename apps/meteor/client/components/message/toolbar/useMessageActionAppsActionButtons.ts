import { type IUIActionButton, MessageActionContext as AppsEngineMessageActionContext } from '@rocket.chat/apps-engine/definition/ui';
import type { IMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { UiKitTriggerTimeoutError } from '../../../../app/ui-message/client/UiKitTriggerTimeoutError';
import type { MessageActionContext, MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { Utilities } from '../../../../ee/lib/misc/Utilities';
import { useAppActionButtons, getIdForActionButton } from '../../../hooks/useAppActionButtons';
import { useApplyButtonFilters } from '../../../hooks/useApplyButtonFilters';
import { useUiKitActionManager } from '../../../uikit/hooks/useUiKitActionManager';

const filterActionsByContext = (context: string | undefined, action: IUIActionButton) => {
	if (!context) {
		return true;
	}

	const messageActionContext = action.when?.messageActionContext || Object.values(AppsEngineMessageActionContext);
	const isContextMatch = messageActionContext.includes(context as AppsEngineMessageActionContext);

	return isContextMatch;
};

export const useMessageActionAppsActionButtons = (message: IMessage, context?: MessageActionContext, category?: string) => {
	const result = useAppActionButtons('messageAction');
	const actionManager = useUiKitActionManager();
	const applyButtonFilters = useApplyButtonFilters(category);
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();
	const data = useMemo(
		() =>
			result.data
				?.filter((action) => filterActionsByContext(context, action))
				.filter((action) => applyButtonFilters(action))
				.map((action) => {
					const item: MessageActionConfig = {
						icon: undefined as any,
						id: getIdForActionButton(action),
						label: Utilities.getI18nKeyForApp(action.labelI18n, action.appId),
						order: 7,
						type: 'apps',
						variant: action.variant,
						group: 'menu',
						action: () => {
							void actionManager
								.emitInteraction(action.appId, {
									type: 'actionButton',
									rid: message.rid,
									tmid: message.tmid,
									mid: message._id,
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

					return item;
				}),
		[actionManager, applyButtonFilters, context, dispatchToastMessage, message._id, message.rid, message.tmid, result.data, t],
	);
	return {
		...result,
		data,
	};
};
