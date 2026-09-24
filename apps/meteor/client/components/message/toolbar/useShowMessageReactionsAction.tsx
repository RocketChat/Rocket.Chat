import type { IMessage } from '@rocket.chat/core-typings';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { useMessageActions } from '../list/MessageListContext';

export const useShowMessageReactionsAction = (message: IMessage): MessageActionConfig | null => {
	const actions = useMessageActions();

	if (!message.reactions) {
		return null;
	}

	return {
		id: 'reaction-list',
		icon: 'emoji',
		label: 'Reactions',
		context: ['message', 'message-mobile', 'threads', 'videoconf', 'videoconf-threads', 'federated'],
		type: 'interaction',
		action() {
			actions.showReactions(message);
		},
		order: 9,
		group: 'menu',
	};
};
