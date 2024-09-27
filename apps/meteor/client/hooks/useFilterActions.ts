import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { useCallback } from 'react';

const DEFAULT_CATEGORY = 'default';

export const useFilterActionsByContextAndCategory = (context: string | undefined, category = 'default') => {
	return useCallback(
		(action: IUIActionButton) => {
			if (!context) {
				return true;
			}

			const actionCategory = action?.category ?? DEFAULT_CATEGORY;
			const isContextMatch = (action.when?.messageActionContext || ['message', 'message-mobile', 'threads', 'starred']).includes(
				context as any,
			);

			const isCategoryMatch = category === DEFAULT_CATEGORY ? actionCategory === DEFAULT_CATEGORY : actionCategory === category;

			return isContextMatch && isCategoryMatch;
		},
		[context, category],
	);
};
