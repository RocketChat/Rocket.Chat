import { UIActionButtonCategory } from '@rocket.chat/apps-engine/definition/ui';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { useCallback } from 'react';

export const useFilterActionsByContextAndCategory = (context: string | undefined, category: UIActionButtonCategory) => {
	return useCallback(
		(action: IUIActionButton) => {
			if (context) {
				const isDefaultCategory = category === UIActionButtonCategory.DEFAULT;
				const isCategoryMatch = isDefaultCategory
					? !action.category || action.category === UIActionButtonCategory.DEFAULT
					: action?.category === category;
				const isContextMatch = (action.when?.messageActionContext || ['message', 'message-mobile', 'threads', 'starred']).includes(
					context as any,
				);

				if (!isContextMatch || !isCategoryMatch) {
					return false;
				}
			}
			return true;
		},
		[context, category],
	);
};
