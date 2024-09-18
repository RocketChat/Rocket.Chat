import { UIActionButtonCategory } from '@rocket.chat/apps-engine/definition/ui';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { useCallback } from 'react';

export const useFilterActionsByContextAndCategory = (context: string | undefined, category: UIActionButtonCategory) => {
	return useCallback(
		(action: IUIActionButton) => {
			if (!context) {
				return true;
			}

			const actionCategory = action?.category ?? UIActionButtonCategory.DEFAULT;
			const isContextMatch = (action.when?.messageActionContext || ['message', 'message-mobile', 'threads', 'starred']).includes(
				context as any,
			);

			const isCategoryMatch =
				category === UIActionButtonCategory.DEFAULT ? actionCategory === UIActionButtonCategory.DEFAULT : actionCategory === category;

			return isContextMatch && isCategoryMatch;
		},
		[context, category],
	);
};
