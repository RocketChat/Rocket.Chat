import type { IMessage } from '@rocket.chat/core-typings';

import { fireGlobalEvent } from './utils/fireGlobalEvent';
import { isLayoutEmbedded } from './utils/isLayoutEmbedded';

// Action Links namespace creation.
export const actionLinks = {
	actions: new Map<string, (message: IMessage, params: string) => void>(),
	register(name: string, fn: (message: IMessage, params: string) => void): void {
		actionLinks.actions.set(name, fn);
	},
	run(actionMethodId: string, message: IMessage): void {
		const embedded = isLayoutEmbedded();

		if (embedded) {
			fireGlobalEvent('click-action-link', {
				actionlink: actionMethodId,
				value: message._id,
				message,
			});
			return;
		}

		const actionLink = message.actionLinks?.find((action) => action.method_id === actionMethodId);

		if (!actionLink) {
			throw new Error('error-invalid-actionlink');
		}

		if (!actionLinks.actions.has(actionLink.method_id)) {
			throw new Error('error-invalid-actionlink');
		}

		const fn = actionLinks.actions.get(actionLink.method_id);
		fn?.(message, actionLink.params);
	},
};
