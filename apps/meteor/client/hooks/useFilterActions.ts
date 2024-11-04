import { MessageActionContext } from '@rocket.chat/apps-engine/definition/ui';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { useCallback } from 'react';

export const useFilterActionsByContext = (context: string | undefined) => {
	return useCallback(
		(action: IUIActionButton) => {
			if (!context) {
				return true;
			}

			const messageActionContext = action.when?.messageActionContext || Object.values(MessageActionContext);
			const isContextMatch = messageActionContext.includes(context as MessageActionContext);

			return isContextMatch;
		},
		[context],
	);
};
