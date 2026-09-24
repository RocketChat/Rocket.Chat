import type { IMessage, ISubscription } from '@rocket.chat/core-typings';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { useMessageActions } from '../list/MessageActionsContext';

export const useCopyAction = (
	message: IMessage,
	{ subscription }: { subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const actions = useMessageActions();

	if (!subscription) {
		return null;
	}

	return {
		id: 'copy',
		icon: 'copy',
		label: 'Copy_text',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		type: 'duplication',
		async action() {
			await actions.copyText(message);
		},
		order: 6,
		group: 'menu',
	};
};
