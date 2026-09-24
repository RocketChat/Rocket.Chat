import { type IUIActionButton, MessageActionContext as AppsEngineMessageActionContext } from '@rocket.chat/apps-engine/definition/ui';
import type { IMessage } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { Utilities } from '../../../../ee/lib/misc/Utilities';
import { useAppActionButtons, getIdForActionButton } from '../../../hooks/useAppActionButtons';
import { useApplyButtonFilters } from '../../../hooks/useApplyButtonFilters';
import type { MessageActionContext, MessageActionConfig } from '../../../lib/MessageAction';
import { useMessageActions } from '../list/MessageActionsContext';

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
	const actions = useMessageActions();
	const applyButtonFilters = useApplyButtonFilters(category);
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
						action: () => actions.runAppAction(action, message),
					};

					return item;
				}),
		[actions, applyButtonFilters, context, message, result.data],
	);
	return {
		...result,
		data,
	};
};
