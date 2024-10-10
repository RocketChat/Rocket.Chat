import { MessageActionContext } from '@rocket.chat/apps-engine/definition/ui';
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
			const messageActionContext = action.when?.messageActionContext || Object.values(MessageActionContext);
			const isContextMatch = messageActionContext.includes(context as MessageActionContext);

			const isCategoryMatch = category === DEFAULT_CATEGORY ? actionCategory === DEFAULT_CATEGORY : actionCategory === category;

			return isContextMatch && isCategoryMatch;
		},
		[context, category],
	);
};
